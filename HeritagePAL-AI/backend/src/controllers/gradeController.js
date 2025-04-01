/**
 * Grade Controller
 * Handles requests related to grade management and grade-topic relationships
 */

const { supabase } = require('../config/supabaseConfig');
const { validateGrade, validateGradeTopicAssignment } = require('../models/Grade');

/**
 * Get all grades
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllGrades(req, res) {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('level', { ascending: true });
    
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error getting grades:', error);
    return res.status(500).json({ message: 'Failed to get grades', error: error.message });
  }
}

/**
 * Get a grade by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getGradeById(req, res) {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error getting grade:', error);
    return res.status(500).json({ message: 'Failed to get grade', error: error.message });
  }
}

/**
 * Create a new grade (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createGrade(req, res) {
  try {
    const { level, name, description } = req.body;
    
    // Validate grade data
    const validation = validateGrade({ level, name, description });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Invalid grade data', errors: validation.errors });
    }
    
    // Check if grade with this level already exists
    const { data: existingGrade, error: checkError } = await supabase
      .from('grades')
      .select('*')
      .eq('level', level)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingGrade) {
      return res.status(409).json({ message: `Grade with level ${level} already exists` });
    }
    
    // Create the grade
    const { data, error } = await supabase
      .from('grades')
      .insert([
        { level, name, description }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({ message: 'Grade created successfully', grade: data });
  } catch (error) {
    console.error('Error creating grade:', error);
    return res.status(500).json({ message: 'Failed to create grade', error: error.message });
  }
}

/**
 * Update a grade (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateGrade(req, res) {
  try {
    const { id } = req.params;
    const { level, name, description } = req.body;
    
    // Validate grade data
    const validation = validateGrade({ level, name, description });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Invalid grade data', errors: validation.errors });
    }
    
    // Check if grade exists
    const { data: existingGrade, error: checkError } = await supabase
      .from('grades')
      .select('*')
      .eq('id', id)
      .single();
    
    if (checkError) throw checkError;
    
    if (!existingGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    // If level is being changed, check if the new level conflicts with another grade
    if (level !== existingGrade.level) {
      const { data: conflictingGrade, error: conflictError } = await supabase
        .from('grades')
        .select('*')
        .eq('level', level)
        .neq('id', id)
        .maybeSingle();
      
      if (conflictError) throw conflictError;
      
      if (conflictingGrade) {
        return res.status(409).json({ message: `Another grade with level ${level} already exists` });
      }
    }
    
    // Update the grade
    const { data, error } = await supabase
      .from('grades')
      .update({ level, name, description, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({ message: 'Grade updated successfully', grade: data });
  } catch (error) {
    console.error('Error updating grade:', error);
    return res.status(500).json({ message: 'Failed to update grade', error: error.message });
  }
}

/**
 * Delete a grade (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteGrade(req, res) {
  try {
    const { id } = req.params;
    
    // Check if grade exists
    const { data: existingGrade, error: checkError } = await supabase
      .from('grades')
      .select('*')
      .eq('id', id)
      .single();
    
    if (checkError) throw checkError;
    
    if (!existingGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    // Delete the grade
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return res.status(500).json({ message: 'Failed to delete grade', error: error.message });
  }
}

/**
 * Assign a topic to a grade (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function assignTopicToGrade(req, res) {
  try {
    const { grade_id, topic_id } = req.body;
    
    // Validate assignment data
    const validation = validateGradeTopicAssignment({ grade_id, topic_id });
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Invalid assignment data', errors: validation.errors });
    }
    
    // Check if grade exists
    const { data: existingGrade, error: gradeError } = await supabase
      .from('grades')
      .select('*')
      .eq('id', grade_id)
      .single();
    
    if (gradeError) throw gradeError;
    
    if (!existingGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    // Check if topic exists
    const { data: existingTopic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topic_id)
      .single();
    
    if (topicError) throw topicError;
    
    if (!existingTopic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if assignment already exists
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from('grade_topics')
      .select('*')
      .eq('grade_id', grade_id)
      .eq('topic_id', topic_id)
      .maybeSingle();
    
    if (assignmentError) throw assignmentError;
    
    if (existingAssignment) {
      return res.status(409).json({ message: 'Topic is already assigned to this grade' });
    }
    
    // Create the assignment
    const { data, error } = await supabase
      .from('grade_topics')
      .insert([
        { grade_id, topic_id }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({ message: 'Topic assigned to grade successfully', assignment: data });
  } catch (error) {
    console.error('Error assigning topic to grade:', error);
    return res.status(500).json({ message: 'Failed to assign topic to grade', error: error.message });
  }
}

/**
 * Remove a topic from a grade (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function removeTopicFromGrade(req, res) {
  try {
    const { grade_id, topic_id } = req.params;
    
    // Check if assignment exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('grade_topics')
      .select('*')
      .eq('grade_id', grade_id)
      .eq('topic_id', topic_id)
      .single();
    
    if (checkError) throw checkError;
    
    if (!existingAssignment) {
      return res.status(404).json({ message: 'Topic is not assigned to this grade' });
    }
    
    // Remove the assignment
    const { error } = await supabase
      .from('grade_topics')
      .delete()
      .eq('grade_id', grade_id)
      .eq('topic_id', topic_id);
    
    if (error) throw error;
    
    return res.status(200).json({ message: 'Topic removed from grade successfully' });
  } catch (error) {
    console.error('Error removing topic from grade:', error);
    return res.status(500).json({ message: 'Failed to remove topic from grade', error: error.message });
  }
}

/**
 * Get all topics for a grade
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTopicsForGrade(req, res) {
  try {
    const { grade_id } = req.params;
    
    // Check if grade exists
    const { data: existingGrade, error: gradeError } = await supabase
      .from('grades')
      .select('*')
      .eq('id', grade_id)
      .single();
    
    if (gradeError) throw gradeError;
    
    if (!existingGrade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    // Get all topics for this grade
    const { data, error } = await supabase
      .from('grade_topics')
      .select(`
        topic_id,
        topics:topic_id (*)
      `)
      .eq('grade_id', grade_id);
    
    if (error) throw error;
    
    // Extract just the topic data from the join
    const topics = data.map(item => item.topics);
    
    return res.status(200).json(topics);
  } catch (error) {
    console.error('Error getting topics for grade:', error);
    return res.status(500).json({ message: 'Failed to get topics for grade', error: error.message });
  }
}

module.exports = {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  assignTopicToGrade,
  removeTopicFromGrade,
  getTopicsForGrade
}; 