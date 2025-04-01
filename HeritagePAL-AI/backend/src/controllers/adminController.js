const { supabase, adminSupabase } = require('../config/supabaseConfig');
const { model } = require('../config/geminiConfig');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * @desc    Upload educational content
 * @route   POST /api/admin/content
 * @access  Private/Admin
 */
const uploadContent = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const { title, description, grade, topic, contentType } = req.body;

    // Validate input
    if (!title || !grade || !topic || !contentType) {
      // Remove the uploaded file if validation fails
      await unlinkAsync(req.file.path);
      res.status(400);
      throw new Error('Please provide title, grade, topic, and content type');
    }

    // Read file content for processing
    const fileContent = await readFileAsync(req.file.path, 'utf8');
    
    // Process content with AI to extract structured knowledge
    // This is a simplified version - in a real app, you'd implement more sophisticated processing
    const result = await model.generateContent(`
      Analyze the following educational content for Guyanese Social Studies:
      
      Title: ${title}
      Grade: ${grade}
      Topic: ${topic}
      
      Content:
      ${fileContent.substring(0, 15000)} // Limit content length
      
      Extract and organize the key concepts, facts, terms, and questions that would be appropriate
      for primary school students in grade ${grade}. Structure the response as JSON with these fields:
      - key_concepts: array of main ideas
      - important_facts: array of factual information
      - vocabulary: array of terms with definitions
      - potential_questions: array of questions for quizzes
    `);
    
    const processedContent = result.response.text();
    
    // Store file metadata and processed content in database
    const { data, error } = await supabase
      .from('educational_content')
      .insert({
        title,
        description: description || '',
        grade: parseInt(grade),
        topic,
        content_type: contentType,
        file_path: req.file.path,
        file_name: req.file.filename,
        file_original_name: req.file.originalname,
        file_size: req.file.size,
        file_mime_type: req.file.mimetype,
        processed_content: processedContent,
        uploaded_by: req.user.id,
        created_at: new Date(),
      })
      .select()
      .single();
      
    if (error) {
      // Remove the uploaded file if database insertion fails
      await unlinkAsync(req.file.path);
      res.status(400);
      throw new Error('Error storing content: ' + error.message);
    }

    res.status(201).json(data);
  } catch (error) {
    // Cleanup file if it exists
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error removing file:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * @desc    Get all uploaded content
 * @route   GET /api/admin/content
 * @access  Private/Admin
 */
const getAllContent = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(400);
      throw new Error('Error retrieving content: ' + error.message);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get content by ID
 * @route   GET /api/admin/content/:id
 * @access  Private/Admin
 */
const getContentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404);
      throw new Error('Content not found');
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update content
 * @route   PUT /api/admin/content/:id
 * @access  Private/Admin
 */
const updateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, grade, topic, contentType } = req.body;

    // First, check if the content exists
    const { data: existingContent, error: fetchError } = await supabase
      .from('educational_content')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      res.status(404);
      throw new Error('Content not found');
    }

    // Update the content
    const { data, error } = await supabase
      .from('educational_content')
      .update({
        title: title || existingContent.title,
        description: description || existingContent.description,
        grade: grade ? parseInt(grade) : existingContent.grade,
        topic: topic || existingContent.topic,
        content_type: contentType || existingContent.content_type,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(400);
      throw new Error('Error updating content: ' + error.message);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete content
 * @route   DELETE /api/admin/content/:id
 * @access  Private/Admin
 */
const deleteContent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First, get the file path
    const { data: contentToDelete, error: fetchError } = await supabase
      .from('educational_content')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      res.status(404);
      throw new Error('Content not found');
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('educational_content')
      .delete()
      .eq('id', id);

    if (deleteError) {
      res.status(400);
      throw new Error('Error deleting content: ' + deleteError.message);
    }

    // Delete the file if it exists
    if (contentToDelete.file_path) {
      try {
        await unlinkAsync(contentToDelete.file_path);
      } catch (unlinkError) {
        console.error('Error removing file:', unlinkError);
        // Continue with the response even if file deletion fails
      }
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate quiz from content
 * @route   POST /api/admin/content/:id/generate-quiz
 * @access  Private/Admin
 */
const generateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { difficulty, questionCount } = req.body;

    // Get the content
    const { data: content, error: fetchError } = await supabase
      .from('educational_content')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      res.status(404);
      throw new Error('Content not found');
    }

    // Generate quiz questions using AI
    const result = await model.generateContent(`
      Using the following educational content for Guyanese Social Studies:
      
      Title: ${content.title}
      Grade: ${content.grade}
      Topic: ${content.topic}
      
      Processed Content:
      ${content.processed_content}
      
      Generate a quiz with ${questionCount || 10} multiple-choice questions about this content.
      The difficulty level should be ${difficulty || 'medium'} for grade ${content.grade} students.
      
      Format the response as a JSON array where each question has:
      - question_text: the question
      - options: array of 4 possible answers
      - correct_answer: the index of the correct option (0-3)
      - explanation: brief explanation of the answer
    `);
    
    const quizQuestions = result.response.text();
    
    // Store the generated quiz
    const { data: quiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        title: `${content.title} Quiz`,
        description: `Quiz generated from ${content.title} for grade ${content.grade}`,
        content_id: id,
        grade: content.grade,
        topic: content.topic,
        questions: quizQuestions,
        difficulty: difficulty || 'medium',
        created_by: req.user.id,
        created_at: new Date(),
      })
      .select()
      .single();
      
    if (insertError) {
      res.status(400);
      throw new Error('Error creating quiz: ' + insertError.message);
    }

    res.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  generateQuiz,
}; 