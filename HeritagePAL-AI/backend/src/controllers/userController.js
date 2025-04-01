const asyncHandler = require('express-async-handler');
const { supabase, adminSupabase } = require('../config/supabaseConfig');
const { validateUserGradeAssignment } = require('../models/User');
const { generateLearningSet } = require('../services/AIService');

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  try {
    // First, try to see if the user already exists in Supabase Auth
    const { data: existingAuthUsers, error: usersError } = await adminSupabase.auth.admin.listUsers();
    
    if (!usersError) {
      const existingAuthUser = existingAuthUsers.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingAuthUser) {
        console.log(`User ${email} already exists in Auth with ID: ${existingAuthUser.id}. Checking users table...`);
        
        // Check if they exist in our users table
        const { data: existingUserRecord, error: userRecordError } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('id', existingAuthUser.id)
          .single();
          
        if (userRecordError && userRecordError.code === 'PGRST116') {
          console.log(`User exists in Auth but not in users table. Creating user record...`);
          
          // User exists in Auth but not in users table - create the user record
          const { data: newUserData, error: createUserError } = await adminSupabase
            .from('users')
            .insert([
              {
                id: existingAuthUser.id,
                name,
                email: email.toLowerCase(),
                role: 'user',
                password: 'managed-by-supabase-auth'
              }
            ])
            .select('id, name, email, role')
            .single();
            
          if (createUserError) {
            console.error(`Failed to create user record: ${createUserError.message}`);
            res.status(500);
            throw new Error(`Failed to create user record: ${createUserError.message}`);
          }
          
          // Now sign them in
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (sessionError) {
            console.error(`Error signing in: ${sessionError.message}`);
            res.status(400);
            throw new Error(`Error signing in: ${sessionError.message}`);
          }
          
          res.status(200).json({
            user: newUserData,
            token: sessionData.session.access_token,
            message: 'User record created and logged in successfully'
          });
          return;
        } else if (existingUserRecord) {
          // User exists in both Auth and users table - just sign them in
          console.log(`User already exists in both Auth and users table. Signing in...`);
          
          // Update user password if it might have changed
          await adminSupabase.auth.admin.updateUserById(
            existingAuthUser.id,
            { password }
          );
          
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (sessionError) {
            console.error(`Error signing in: ${sessionError.message}`);
            res.status(400);
            throw new Error(`Error signing in: ${sessionError.message}`);
          }
          
          res.status(200).json({
            user: existingUserRecord,
            token: sessionData.session.access_token,
            message: 'User signed in successfully'
          });
          return;
        }
      }
    }

    // If we get here, the user does not exist in Auth - proceed with creating a new user
    console.log(`Creating new user: ${email}`);
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      res.status(400);
      throw new Error(`Error creating user: ${authError.message}`);
    }

    // Add user to the users table
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name,
          email: email.toLowerCase(),
          role: 'user',
          password: 'managed-by-supabase-auth'
        }
      ])
      .select('id, name, email, role')
      .single();

    if (userError) {
      // Rollback: Delete the auth user if DB insert fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      res.status(400);
      throw new Error(`Error creating user profile: ${userError.message}`);
    }

    // Sign in the user to get a session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      res.status(400);
      throw new Error(`Error signing in: ${sessionError.message}`);
    }

    res.status(201).json({
      user: userData,
      token: sessionData.session.access_token,
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Registration failed: ${error.message}`);
  }
});

/**
 * @desc    Authenticate a user
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Get user details from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      console.log(`User ${email} exists in Auth but not in users table. Creating user record...`);
      
      // Create user record if it doesn't exist
      const userName = data.user.user_metadata?.name || email.split('@')[0];
      
      const { data: newUserData, error: createError } = await adminSupabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            name: userName,
            email: email.toLowerCase(),
            role: 'user',
            password: 'managed-by-supabase-auth'
          }
        ])
        .select('id, name, email, role')
        .single();
        
      if (createError) {
        console.error(`Failed to create missing user record: ${createError.message}`);
        res.status(500);
        throw new Error('Failed to create user record. Please contact support.');
      }
      
      res.json({
        user: newUserData,
        token: data.session.access_token,
      });
      return;
    }

    res.json({
      user: userData,
      token: data.session.access_token,
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message);
  }
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // The auth middleware already verifies the token and adds the user to req
  
  // Get user's grades
  const { data: userGrades, error: gradesError } = await supabase
    .from('user_grades')
    .select('grade_id, grades:grade_id(*)')
    .eq('user_id', req.user.id);
    
  if (gradesError) {
    console.error('Error getting user grades:', gradesError.message);
  }
  
  // Add grades to user object
  const userWithGrades = {
    ...req.user,
    grades: userGrades ? userGrades.map(ug => ug.grades) : []
  };
  
  res.status(200).json(userWithGrades);
});

/**
 * @desc    Assign a grade to a user
 * @route   POST /api/users/:id/grades
 * @access  Private
 */
const assignGradeToUser = asyncHandler(async (req, res) => {
  const { id: user_id } = req.params;
  const { grade_id } = req.body;
  
  // Validate data
  const validation = validateUserGradeAssignment({ user_id, grade_id });
  if (!validation.isValid) {
    res.status(400);
    throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
  }
  
  // Check if user exists
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();
    
  if (userError || !existingUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if grade exists
  const { data: existingGrade, error: gradeError } = await supabase
    .from('grades')
    .select('*')
    .eq('id', grade_id)
    .single();
    
  if (gradeError || !existingGrade) {
    res.status(404);
    throw new Error('Grade not found');
  }
  
  // Check if assignment already exists
  const { data: existingAssignment, error: assignmentError } = await supabase
    .from('user_grades')
    .select('*')
    .eq('user_id', user_id)
    .eq('grade_id', grade_id)
    .maybeSingle();
    
  if (assignmentError) {
    res.status(500);
    throw new Error(`Error checking assignment: ${assignmentError.message}`);
  }
  
  if (existingAssignment) {
    return res.status(200).json({ message: 'User is already assigned to this grade' });
  }
  
  // Create assignment
  const { data, error } = await supabase
    .from('user_grades')
    .insert([{ user_id, grade_id }])
    .select()
    .single();
    
  if (error) {
    res.status(500);
    throw new Error(`Error assigning grade: ${error.message}`);
  }
  
  res.status(201).json({
    message: 'Grade assigned successfully',
    assignment: data
  });
});

/**
 * @desc    Remove grade from user
 * @route   DELETE /api/users/:id/grades/:grade_id
 * @access  Private
 */
const removeGradeFromUser = asyncHandler(async (req, res) => {
  const { id: user_id, grade_id } = req.params;
  
  // Check if assignment exists
  const { data: existingAssignment, error: checkError } = await supabase
    .from('user_grades')
    .select('*')
    .eq('user_id', user_id)
    .eq('grade_id', grade_id)
    .maybeSingle();
    
  if (checkError) {
    res.status(500);
    throw new Error(`Error checking assignment: ${checkError.message}`);
  }
  
  if (!existingAssignment) {
    return res.status(404).json({ message: 'User is not assigned to this grade' });
  }
  
  // Remove assignment
  const { error } = await supabase
    .from('user_grades')
    .delete()
    .eq('user_id', user_id)
    .eq('grade_id', grade_id);
    
  if (error) {
    res.status(500);
    throw new Error(`Error removing grade: ${error.message}`);
  }
  
  res.status(200).json({ message: 'Grade removed successfully' });
});

/**
 * @desc    Get user's grades
 * @route   GET /api/users/:id/grades
 * @access  Private
 */
const getUserGrades = asyncHandler(async (req, res) => {
  const { id: user_id } = req.params;
  
  // Check if user exists
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();
    
  if (userError || !existingUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Get user's grades
  const { data, error } = await supabase
    .from('user_grades')
    .select('grade_id, grades:grade_id(*)')
    .eq('user_id', user_id);
    
  if (error) {
    res.status(500);
    throw new Error(`Error getting grades: ${error.message}`);
  }
  
  // Extract grade objects
  const grades = data.map(item => item.grades);
  
  res.status(200).json(grades);
});

/**
 * @desc    Get user learning history (quizzes, flashcards, topics)
 * @route   GET /api/users/learning-history
 * @access  Private
 */
const getLearningHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's grades first
    const { data: userGrades, error: gradesError } = await supabase
      .from('user_grades')
      .select('grade_id')
      .eq('user_id', userId);
      
    if (gradesError) {
      console.error('Error retrieving user grades:', gradesError.message);
    }
    
    const gradeIds = userGrades ? userGrades.map(ug => ug.grade_id) : [];

    // Get quiz results
    const { data: quizResults, error: quizError } = await supabase
      .from('quiz_results')
      .select('*, quiz:quizzes(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Log error but don't throw
    if (quizError) {
      console.error('Error retrieving quiz results:', quizError.message);
    }

    // Get flashcard history
    const { data: flashcardHistory, error: flashcardError } = await supabase
      .from('flashcard_sessions')
      .select('*, topic:topics(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Log error but don't throw
    if (flashcardError) {
      console.error('Error retrieving flashcard history:', flashcardError.message);
    }

    // Get chat history
    const { data: chatHistory, error: chatError } = await supabase
      .from('user_chat_sessions')
      .select('session_id, created_at, topic:topic_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Log error but don't throw
    if (chatError) {
      console.error('Error retrieving chat history:', chatError.message);
    }

    // Get topic history
    const { data: topicHistory, error: topicError } = await supabase
      .from('user_topic_history')
      .select('*, topic:topic_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Log error but don't throw
    if (topicError) {
      console.error('Error retrieving topic history:', topicError.message);
    }

    res.json({
      quizzes: quizResults || [],
      flashcards: flashcardHistory || [],
      chats: chatHistory || [],
      topics: topicHistory || [],
      grades: gradeIds
    });
  } catch (error) {
    console.error('Error in learning history:', error.message);
    // Return empty arrays instead of error
    res.json({
      quizzes: [],
      flashcards: [],
      chats: [],
      topics: [],
      grades: []
    });
  }
};

/**
 * @desc    Generate and save a learning session for a user
 * @route   POST /api/users/learning-session
 * @access  Private (requires user login)
 */
const createLearningSession = async (req, res, next) => {
  try {
    const { topic_id, grade } = req.body;
    const userId = req.user.id; // From auth middleware
    
    if (!topic_id) {
      res.status(400);
      throw new Error('Topic ID is required');
    }
    
    if (!grade || isNaN(grade) || grade < 1 || grade > 6) {
      res.status(400);
      throw new Error('Valid grade level (1-6) is required');
    }
    
    // Get topic information
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('id, title, content')
      .eq('id', topic_id)
      .single();
    
    if (topicError || !topicData) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Generate learning content using AI
    const learningSet = await generateLearningSet(
      topicData.id,
      topicData.title,
      topicData.content,
      grade
    );
    
    // Start a transaction to save all content
    // Using separate inserts but could be modified to use supabase transactions if available
    
    // 1. Save educational content
    const { data: contentData, error: contentError } = await supabase
      .from('educational_content')
      .insert({
        ...learningSet.educational_content,
        user_id: userId,
        is_ai_generated: true
      })
      .select()
      .single();
    
    if (contentError) {
      console.error('Error saving educational content:', contentError);
      res.status(500);
      throw new Error('Failed to save educational content');
    }
    
    // 2. Save quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        ...learningSet.quiz,
        user_id: userId,
        is_ai_generated: true,
        questions: JSON.stringify(learningSet.quiz.questions)
      })
      .select()
      .single();
    
    if (quizError) {
      console.error('Error saving quiz:', quizError);
      res.status(500);
      throw new Error('Failed to save quiz');
    }
    
    // 3. Save flashcard set
    const { data: flashcardData, error: flashcardError } = await supabase
      .from('flashcard_sets')
      .insert({
        ...learningSet.flashcard_set,
        user_id: userId,
        is_ai_generated: true
      })
      .select()
      .single();
    
    if (flashcardError) {
      console.error('Error saving flashcard set:', flashcardError);
      res.status(500);
      throw new Error('Failed to save flashcard set');
    }
    
    // 4. Save user learning session record
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_learning_sessions')
      .insert({
        user_id: userId,
        topic_id: topic_id,
        grade: grade,
        content_id: contentData.id,
        quiz_id: quizData.id,
        flashcard_set_id: flashcardData.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('Error saving learning session:', sessionError);
      res.status(500);
      throw new Error('Failed to save learning session');
    }
    
    // Return session data with IDs of created content
    res.status(201).json({
      session_id: sessionData.id,
      content_id: contentData.id,
      quiz_id: quizData.id,
      flashcard_set_id: flashcardData.id,
      topic: topicData.title,
      grade: grade
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's learning history
 * @route   GET /api/users/learning-history
 * @access  Private (requires user login)
 */
const getUserLearningHistory = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    // Get user's learning sessions with related content
    const { data, error } = await supabase
      .from('user_learning_sessions')
      .select(`
        id, 
        created_at,
        grade,
        topics(id, title),
        educational_content(id, title),
        quizzes(id, title),
        flashcard_sets(id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error retrieving learning history:', error);
      res.status(500);
      throw new Error('Failed to retrieve learning history');
    }
    
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  assignGradeToUser,
  removeGradeFromUser,
  getUserGrades,
  getLearningHistory,
  createLearningSession,
  getUserLearningHistory
}; 