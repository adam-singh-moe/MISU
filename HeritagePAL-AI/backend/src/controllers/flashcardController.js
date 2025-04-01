const { supabase } = require('../config/supabaseConfig');
const { model } = require('../config/geminiConfig');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Get flashcards by grade and topic
 * @route   GET /api/flashcards
 * @access  Public
 */
const getFlashcards = async (req, res, next) => {
  try {
    const { grade, topic } = req.query;
    
    let query = supabase
      .from('flashcard_sets')
      .select('*');
    
    // Apply filters if provided
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    
    if (topic) {
      query = query.eq('topic_id', topic);
    }
    
    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving flashcards: ' + error.message);
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get flashcard set by ID
 * @route   GET /api/flashcards/set/:id
 * @access  Public
 */
const getFlashcardSetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      res.status(404);
      throw new Error('Flashcard set not found');
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate flashcards for a topic
 * @route   POST /api/flashcards/generate
 * @access  Public
 */
const generateFlashcards = async (req, res, next) => {
  try {
    const { topic, grade, count } = req.body;
    const userId = req.user?.id; // Will be undefined for non-authenticated users
    
    if (!topic && !grade) {
      res.status(400);
      throw new Error('Please provide either a topic or grade');
    }
    
    // Get relevant content for the topic/grade
    let query = supabase.from('topics').select('*');
    
    if (topic) {
      query = query.eq('title', topic);
    }
    
    const { data: topicData, error: topicError } = await query.limit(10);
    
    if (topicError || !topicData || topicData.length === 0) {
      res.status(404);
      throw new Error('No content found for this topic or grade');
    }
    
    // Prepare content for the AI
    let contextData = '';
    topicData.forEach(topic => {
      contextData += `Topic: ${topic.title}\nContent: ${topic.content?.substring(0, 1000) || 'No content available'}\n\n`;
    });
    
    let flashcards;
    
    try {
      // Generate flashcards
      const result = await model.generateContent(`
        Generate educational flashcards for Guyanese primary school students studying Social Studies.
        
        Based on the following content:
        ${contextData}
        
        Create ${count || 10} flashcards that are appropriate for grade ${grade || 'any'} students.
        Each flashcard should have a question on the front and the answer on the back.
        Make the flashcards educational, accurate, and relevant to Guyanese Social Studies.
        
        Format the response as a JSON array where each flashcard has:
        - front: the question or term
        - back: the answer or definition
        - topic: the specific topic this relates to
      `);
      
      const flashcardsText = result.response.text();
      
      try {
        flashcards = JSON.parse(flashcardsText);
      } catch (parseError) {
        // Handle potential JSON parsing issues
        console.error('Error parsing AI-generated flashcards:', parseError);
        throw new Error('Error parsing AI-generated flashcards');
      }
    } catch (aiError) {
      console.error('Error generating flashcards with AI:', aiError);
      
      // Provide a default set of flashcards as fallback
      flashcards = [
        {
          front: "What is the capital of Guyana?",
          back: "Georgetown",
          topic: "Geography"
        },
        {
          front: "What are the colors of the Guyanese flag?",
          back: "Green, yellow, red, black, and white",
          topic: "National Symbols"
        },
        {
          front: "What is the largest river in Guyana?",
          back: "The Essequibo River",
          topic: "Geography"
        }
      ];
    }
    
    // Create a session ID for these flashcards
    const sessionId = uuidv4();
    
    // If user is logged in, save the flashcard set
    let savedFlashcardSet = null;
    if (userId) {
      try {
        // 1. Save flashcard set
        const { data: flashcardSet, error: flashcardSetError } = await supabase
          .from('flashcard_sets')
          .insert({
            title: `${topicData[0].title} Flashcards`,
            description: `Flashcards about ${topicData[0].title} for grade ${grade || 'all'} students`,
            topic_id: topicData[0].id,
            grade: grade ? parseInt(grade) : null,
            user_id: userId,
            is_ai_generated: true,
            flashcards: flashcards,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (flashcardSetError) {
          console.error('Error saving flashcard set:', flashcardSetError);
        } else {
          savedFlashcardSet = flashcardSet;
        }
        
        // 2. Store flashcard session
        await supabase
          .from('flashcard_sessions')
          .insert({
            user_id: userId,
            session_id: sessionId,
            topic_id: topicData[0].id,
            flashcard_count: flashcards.length,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error storing flashcard data:', error);
        // Continue execution even if storage fails
      }
    }
    
    res.json({
      sessionId,
      topicTitle: topicData[0].title,
      grade: grade,
      flashcards,
      saved: savedFlashcardSet !== null,
      flashcardSetId: savedFlashcardSet?.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all flashcard sets
 * @route   GET /api/flashcards/sets
 * @access  Public
 */
const getFlashcardSets = async (req, res, next) => {
  try {
    const { grade, topic } = req.query;
    
    let query = supabase
      .from('flashcard_sets')
      .select('*, topics(title)');
    
    // Apply filters if provided
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    
    if (topic) {
      query = query.eq('topic_id', topic);
    }
    
    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving flashcard sets: ' + error.message);
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get topics list for flashcards
 * @route   GET /api/flashcards/topics
 * @access  Public
 */
const getFlashcardTopics = async (req, res, next) => {
  try {
    // First get all flashcard sets
    const { data: flashcardSets, error: setsError } = await supabase
      .from('flashcard_sets')
      .select('topic_id');
    
    if (setsError) {
      res.status(400);
      throw new Error('Error retrieving flashcard sets: ' + setsError.message);
    }
    
    // Extract unique topic IDs
    const topicIds = [...new Set(flashcardSets.map(item => item.topic_id))].filter(Boolean);
    
    if (topicIds.length === 0) {
      return res.json([]);
    }
    
    // Get topic details
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, title')
      .in('id', topicIds);
    
    if (topicsError) {
      res.status(400);
      throw new Error('Error retrieving topics: ' + topicsError.message);
    }
    
    res.json(topics || []);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's flashcard history
 * @route   GET /api/flashcards/history
 * @access  Private
 */
const getFlashcardHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('flashcard_sessions')
      .select('*, topic:topics(title, grade)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving flashcard history: ' + error.message);
    }
    
    res.json(data || []);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFlashcards,
  getFlashcardSetById,
  generateFlashcards,
  getFlashcardSets,
  getFlashcardTopics,
  getFlashcardHistory
};