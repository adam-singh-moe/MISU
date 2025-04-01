const { supabase } = require('../config/supabaseConfig');
const { validateTopic, validateTopicGradeAssignment } = require('../models/Topic');

/**
 * @desc    Get all topics
 * @route   GET /api/topics
 * @access  Public
 */
const getAllTopics = async (req, res, next) => {
  try {
    const { grade_id } = req.query;
    
    if (grade_id) {
      // Get topics by grade
      const { data, error } = await supabase
        .from('grade_topics')
        .select(`
          topic_id,
          topics:topic_id (*)
        `)
        .eq('grade_id', grade_id);
      
      if (error) {
        res.status(400);
        throw new Error('Error retrieving topics: ' + error.message);
      }
      
      // Extract topic data
      const topics = data.map(item => item.topics);
      
      res.json(topics || []);
    } else {
      // Get all topics
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        res.status(400);
        throw new Error('Error retrieving topics: ' + error.message);
      }
      
      res.json(data || []);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get topic by ID
 * @route   GET /api/topics/:id
 * @access  Public
 */
const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get topic with its grades
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Get grades for this topic
    const { data: gradeTopics, error: gradesError } = await supabase
      .from('grade_topics')
      .select(`
        grade_id,
        grades:grade_id (*)
      `)
      .eq('topic_id', id);
    
    if (gradesError) {
      console.error('Error getting topic grades:', gradesError.message);
    }
    
    // Add grades to response
    const topicWithGrades = {
      ...data,
      grades: gradeTopics ? gradeTopics.map(gt => gt.grades) : []
    };
    
    res.json(topicWithGrades);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new topic
 * @route   POST /api/topics
 * @access  Private/Admin
 */
const createTopic = async (req, res, next) => {
  try {
    const { title, description, content, grade_ids } = req.body;
    
    // Validate input
    const validation = validateTopic({ title, content });
    if (!validation.isValid) {
      res.status(400);
      throw new Error(`Invalid topic data: ${validation.errors.join(', ')}`);
    }
    
    // Create topic
    const { data, error } = await supabase
      .from('topics')
      .insert([
        {
          title,
          description: description || null,
          content,
          created_by: req.user.id
        }
      ])
      .select()
      .single();
    
    if (error) {
      res.status(400);
      throw new Error('Error creating topic: ' + error.message);
    }
    
    // If grade_ids were provided, assign the topic to those grades
    if (grade_ids && Array.isArray(grade_ids) && grade_ids.length > 0) {
      const gradeTopicsData = grade_ids.map(grade_id => ({
        grade_id,
        topic_id: data.id
      }));
      
      const { error: assignError } = await supabase
        .from('grade_topics')
        .insert(gradeTopicsData);
      
      if (assignError) {
        console.error('Error assigning topic to grades:', assignError.message);
      }
    }
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a topic
 * @route   PUT /api/topics/:id
 * @access  Private/Admin
 */
const updateTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, content, grade_ids } = req.body;
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (checkError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Update topic
    const { data, error } = await supabase
      .from('topics')
      .update({
        title: title || existingTopic.title,
        description: description !== undefined ? description : existingTopic.description,
        content: content || existingTopic.content,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      res.status(400);
      throw new Error('Error updating topic: ' + error.message);
    }
    
    // If grade_ids were provided, update the topic-grade assignments
    if (grade_ids && Array.isArray(grade_ids)) {
      // First, delete all existing assignments
      const { error: deleteError } = await supabase
        .from('grade_topics')
        .delete()
        .eq('topic_id', id);
      
      if (deleteError) {
        console.error('Error removing existing grade assignments:', deleteError.message);
      }
      
      // Then, create new assignments if there are any grade_ids
      if (grade_ids.length > 0) {
        const gradeTopicsData = grade_ids.map(grade_id => ({
          grade_id,
          topic_id: id
        }));
        
        const { error: assignError } = await supabase
          .from('grade_topics')
          .insert(gradeTopicsData);
        
        if (assignError) {
          console.error('Error assigning topic to grades:', assignError.message);
        }
      }
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a topic
 * @route   DELETE /api/topics/:id
 * @access  Private/Admin
 */
const deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Delete all grade-topic relationships
    const { error: deleteRelError } = await supabase
      .from('grade_topics')
      .delete()
      .eq('topic_id', id);
    
    if (deleteRelError) {
      console.error('Error deleting grade-topic relationships:', deleteRelError.message);
    }
    
    // Delete topic
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);
    
    if (error) {
      res.status(400);
      throw new Error('Error deleting topic: ' + error.message);
    }
    
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record user topic view 
 * @route   POST /api/topics/:id/view
 * @access  Private
 */
const recordTopicView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from('topics')
      .select('id, title')
      .eq('id', id)
      .single();
    
    if (checkError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Check if user has access to this topic based on their grade
    const { data: userGrades, error: gradesError } = await supabase
      .from('user_grades')
      .select('grade_id')
      .eq('user_id', userId);
    
    if (gradesError) {
      console.error('Error getting user grades:', gradesError.message);
    }
    
    if (userGrades && userGrades.length > 0) {
      const gradeIds = userGrades.map(ug => ug.grade_id);
      
      // Check if the topic is assigned to any of the user's grades
      const { data: topicGrades, error: topicGradesError } = await supabase
        .from('grade_topics')
        .select('grade_id')
        .eq('topic_id', id)
        .in('grade_id', gradeIds);
      
      if (topicGradesError) {
        console.error('Error checking topic access:', topicGradesError.message);
      }
      
      // Only allow viewing if the topic is assigned to user's grade or user is admin
      if (!topicGrades || topicGrades.length === 0) {
        // Check if user is admin
        const { data: adminCheck, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (adminError) {
          console.error('Error checking admin status:', adminError.message);
        }
        
        if (!adminCheck) {
          res.status(403);
          throw new Error('You do not have access to this topic');
        }
      }
    }
    
    // Record the view
    const { error } = await supabase
      .from('user_topic_history')
      .insert({
        user_id: userId,
        topic_id: id,
        viewed_at: new Date(),
      });
    
    if (error) {
      res.status(400);
      throw new Error('Error recording topic view: ' + error.message);
    }
    
    res.json({ message: 'Topic view recorded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign topic to grades
 * @route   POST /api/topics/:id/grades
 * @access  Private/Admin
 */
const assignTopicToGrades = async (req, res, next) => {
  try {
    const { id: topic_id } = req.params;
    const { grade_ids } = req.body;
    
    // Validate input
    const validation = validateTopicGradeAssignment({ topic_id, grade_ids });
    if (!validation.isValid) {
      res.status(400);
      throw new Error(`Invalid assignment data: ${validation.errors.join(', ')}`);
    }
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', topic_id)
      .single();
    
    if (checkError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Create grade-topic assignments
    const gradeTopicsData = grade_ids.map(grade_id => ({
      grade_id,
      topic_id
    }));
    
    // First, delete any existing assignments
    const { error: deleteError } = await supabase
      .from('grade_topics')
      .delete()
      .eq('topic_id', topic_id);
    
    if (deleteError) {
      console.error('Error removing existing grade assignments:', deleteError.message);
    }
    
    // Then, create new assignments
    const { data, error } = await supabase
      .from('grade_topics')
      .insert(gradeTopicsData)
      .select();
    
    if (error) {
      res.status(400);
      throw new Error('Error assigning topic to grades: ' + error.message);
    }
    
    res.status(201).json({ message: 'Topic assigned to grades successfully', assignments: data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get grades for a topic
 * @route   GET /api/topics/:id/grades
 * @access  Public
 */
const getTopicGrades = async (req, res, next) => {
  try {
    const { id: topic_id } = req.params;
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', topic_id)
      .single();
    
    if (checkError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Get grades for this topic
    const { data, error } = await supabase
      .from('grade_topics')
      .select(`
        grade_id,
        grades:grade_id (*)
      `)
      .eq('topic_id', topic_id);
    
    if (error) {
      res.status(400);
      throw new Error('Error getting topic grades: ' + error.message);
    }
    
    // Extract grade objects
    const grades = data.map(item => item.grades);
    
    res.json(grades);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  recordTopicView,
  assignTopicToGrades,
  getTopicGrades
}; 