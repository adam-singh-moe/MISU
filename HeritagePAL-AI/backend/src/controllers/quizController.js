const { supabase } = require('../config/supabaseConfig');
const { model } = require('../config/geminiConfig');

/**
 * @desc    Get all quizzes
 * @route   GET /api/quizzes
 * @access  Public
 */
const getAllQuizzes = async (req, res, next) => {
  try {
    const { grade, topic, difficulty } = req.query;
    
    let query = supabase
      .from('quizzes')
      .select('id, title, description, topic_id, difficulty, created_at');
    
    // Apply filters if provided
    if (grade) {
      // Join with grade_topics to filter by grade
      const { data: gradeTopics, error: gradeError } = await supabase
        .from('grade_topics')
        .select('topic_id')
        .eq('grade_id', grade);
        
      if (!gradeError && gradeTopics && gradeTopics.length > 0) {
        const topicIds = gradeTopics.map(gt => gt.topic_id);
        query = query.in('topic_id', topicIds);
      }
    }
    
    if (topic) {
      query = query.eq('topic_id', topic);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving quizzes: ' + error.message);
    }
    
    // If no data is returned, return empty array instead of throwing error
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get quiz by ID
 * @route   GET /api/quizzes/:id
 * @access  Public
 */
const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      res.status(404);
      throw new Error('Quiz not found');
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate a practice exam
 * @route   POST /api/quizzes/practice-exam
 * @access  Public
 */
const generatePracticeExam = async (req, res, next) => {
  try {
    const { grade, topics, questionCount } = req.body;
    
    if (!grade) {
      res.status(400);
      throw new Error('Grade is required');
    }
    
    // Get the grade_id from the grades table
    const { data: gradeData, error: gradeError } = await supabase
      .from('grades')
      .select('id')
      .eq('level', parseInt(grade))
      .single();
    
    if (gradeError) {
      console.error('Error getting grade:', gradeError);
      res.status(404);
      throw new Error('Grade not found');
    }
    
    const gradeId = gradeData?.id;
    
    // Get relevant content for the grade by joining tables
    const { data: gradeTopic, error: gradeTopicError } = await supabase
      .from('grade_topics')
      .select('topic_id')
      .eq('grade_id', gradeId);
    
    if (gradeTopicError) {
      res.status(404);
      throw new Error('No topics found for this grade');
    }
    
    const topicIds = gradeTopic.map(gt => gt.topic_id);
    
    const { data: relevantContent, error: contentError } = await supabase
      .from('educational_content')
      .select('title, processed_content, topic_id')
      .in('topic_id', topicIds)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (contentError || !relevantContent || relevantContent.length === 0) {
      res.status(404);
      throw new Error('No content found for this grade');
    }
    
    // Get topic information
    const { data: topicsData, error: topicsError } = await supabase
      .from('topics')
      .select('id, title')
      .in('id', topicIds);
      
    if (topicsError) {
      res.status(404);
      throw new Error('Error retrieving topics');
    }
    
    // Create a map of topic_id to topic title
    const topicMap = {};
    topicsData.forEach(topic => {
      topicMap[topic.id] = topic.title;
    });
    
    // Filter by topics if provided
    let filteredContent = relevantContent;
    if (topics && topics.length > 0) {
      filteredContent = relevantContent.filter(content => 
        topics.includes(content.topic_id)
      );
    }
    
    // Prepare content for the AI
    let contextData = '';
    filteredContent.forEach(content => {
      const topicTitle = topicMap[content.topic_id] || 'Unknown Topic';
      contextData += `Topic: ${topicTitle}\nTitle: ${content.title}\nContent: ${content.processed_content?.substring(0, 1000) || 'No content available'}\n\n`;
    });
    
    let examQuestions;
    
    try {
      // Generate practice exam questions
      const result = await model.generateContent(`
        Generate a comprehensive practice exam for Guyanese Social Studies for grade ${grade} students.
        
        Based on the following educational content:
        ${contextData}
        
        Create a well-rounded practice exam with ${questionCount || 15} multiple-choice questions covering the topics provided.
        Include a mix of difficulty levels appropriate for grade ${grade}.
        
        Format the response as a JSON array where each question has:
        - question_text: the question
        - options: array of 4 possible answers
        - correct_answer: the index of the correct option (0-3)
        - topic: the topic this question relates to
        - difficulty: "easy", "medium", or "challenging"
      `);
      
      examQuestions = result.response.text();
      
      // Try to parse the result to verify it's valid JSON
      try {
        JSON.parse(examQuestions);
      } catch (parseError) {
        console.error('Error parsing AI-generated quiz questions:', parseError);
        throw new Error('Failed to generate valid quiz questions');
      }
    } catch (aiError) {
      console.error('Error generating practice exam with AI:', aiError);
      
      // Provide a default set of questions as fallback
      examQuestions = JSON.stringify([
        {
          question_text: "What is the capital city of Guyana?",
          options: ["Georgetown", "Linden", "New Amsterdam", "Bartica"],
          correct_answer: 0,
          topic: "Geography",
          difficulty: "easy"
        },
        {
          question_text: "Which of these countries does NOT border Guyana?",
          options: ["Brazil", "Venezuela", "Suriname", "Colombia"],
          correct_answer: 3,
          topic: "Geography",
          difficulty: "medium"
        }
      ]);
    }
    
    // Store the generated practice exam
    const { data: practiceExam, error: insertError } = await supabase
      .from('practice_exams')
      .insert({
        title: `Grade ${grade} Practice Exam`,
        description: `Comprehensive practice exam for grade ${grade} Social Studies`,
        grade_id: gradeId,
        questions: examQuestions,
        created_at: new Date(),
      })
      .select()
      .single();
      
    if (insertError) {
      res.status(400);
      throw new Error('Error creating practice exam: ' + insertError.message);
    }
    
    res.status(201).json(practiceExam);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit quiz answers and get score
 * @route   POST /api/quizzes/:id/submit
 * @access  Public
 */
const submitQuizAnswers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, sessionId } = req.body;
    const userId = req.user?.id; // Will be undefined for non-authenticated users
    
    if (!answers || !Array.isArray(answers)) {
      res.status(400);
      throw new Error('Please provide an array of answers');
    }
    
    // Get the quiz
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      res.status(404);
      throw new Error('Quiz not found');
    }
    
    // Parse the quiz questions
    let questions;
    try {
      questions = JSON.parse(quiz.questions);
    } catch (parseError) {
      res.status(500);
      throw new Error('Error parsing quiz questions');
    }
    
    // Calculate score
    let correctCount = 0;
    const results = answers.map((answerIndex, i) => {
      const question = questions[i];
      
      if (!question) {
        return { error: 'Question not found' };
      }
      
      const isCorrect = parseInt(answerIndex) === question.correct_answer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      return {
        question: question.question_text,
        userAnswer: parseInt(answerIndex),
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation || null,
      };
    });
    
    const score = {
      totalQuestions: questions.length,
      correctCount,
      percentage: Math.round((correctCount / questions.length) * 100),
      results,
    };
    
    // Store quiz result if sessionId is provided or user is authenticated
    if (sessionId || userId) {
      await supabase
        .from('quiz_results')
        .insert({
          quiz_id: id,
          session_id: sessionId || null,
          user_id: userId || null,
          score: score.percentage,
          correct_count: correctCount,
          total_questions: questions.length,
          created_at: new Date(),
        });
    }
    
    res.json(score);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get topics list for quizzes
 * @route   GET /api/quizzes/topics
 * @access  Public
 */
const getQuizTopics = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('topic')
      .order('topic');
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving topics: ' + error.message);
    }
    
    // Extract unique topics
    const uniqueTopics = [...new Set(data.map(item => item.topic))];
    
    res.json(uniqueTopics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  generatePracticeExam,
  submitQuizAnswers,
  getQuizTopics,
}; 