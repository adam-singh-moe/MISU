const { supabase } = require('../config/supabaseConfig');
const { model } = require('../config/geminiConfig');
const { generateLearningSet } = require('../services/AIService');

/**
 * @desc    Get topics list
 * @route   GET /api/content/topics
 * @access  Public
 */
const getTopics = async (req, res, next) => {
  try {
    // Query topics table with a more comprehensive join to get grade information
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, title, description')
      .order('title');
    
    if (error) {
      console.error('Error retrieving topics:', error.message);
      // Return empty array instead of error
      return res.json([]);
    }
    
    if (!topics || topics.length === 0) {
      return res.json([]);
    }
    
    // Get all grade-topic relationships
    const { data: gradeTopics, error: gradeTopicsError } = await supabase
      .from('grade_topics')
      .select(`
        topic_id,
        grades!grade_id(id, level)
      `);
      
    if (gradeTopicsError) {
      console.error('Error retrieving grade-topic relationships:', gradeTopicsError.message);
    }
    
    // Create a map of topic_id to grade levels
    const topicGradeMap = {};
    if (gradeTopics && gradeTopics.length > 0) {
      gradeTopics.forEach(relation => {
        if (relation.grades && relation.grades.level) {
          if (!topicGradeMap[relation.topic_id]) {
            topicGradeMap[relation.topic_id] = [];
          }
          topicGradeMap[relation.topic_id].push(relation.grades.level);
        }
      });
    }
    
    // Map the topics to include grade level information
    const topicsWithGrades = topics.map(topic => {
      const grades = topicGradeMap[topic.id] || [];
      // For simplicity in the frontend, if a topic is associated with multiple grades,
      // we'll use the lowest grade as the primary gradeLevel
      const gradeLevel = grades.length > 0 ? Math.min(...grades) : null;
      
      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        gradeLevel: gradeLevel,
        allGrades: grades
      };
    });
    
    res.json(topicsWithGrades);
  } catch (error) {
    console.error('Exception in getTopics:', error);
    res.json([]); // Return empty array on error
  }
};

/**
 * @desc    Get topic content
 * @route   GET /api/content/topic/:topic
 * @access  Public
 */
const getTopicContent = async (req, res, next) => {
  try {
    const { topic } = req.params; // This is now the topic_id
    const { grade } = req.query;
    
    // First check if the topic exists
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topic)
      .single();
      
    if (topicError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Get content for this topic
    let query = supabase
      .from('educational_content')
      .select('*')
      .eq('topic_id', topic);
    
    // Filter by grade if provided
    if (grade) {
      // Get the grade_id
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('id')
        .eq('level', parseInt(grade))
        .single();
        
      if (gradeError) {
        res.status(404);
        throw new Error('Grade not found');
      }
      
      // Check if this topic is associated with this grade
      const { data: gradeTopicData, error: gradeTopicError } = await supabase
        .from('grade_topics')
        .select('*')
        .eq('grade_id', gradeData.id)
        .eq('topic_id', topic)
        .single();
        
      if (gradeTopicError) {
        res.status(404);
        throw new Error('This topic is not available for the specified grade');
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving content: ' + error.message);
    }
    
    // Include the topic data
    res.json({
      topic: topicData,
      content: data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get content by grade
 * @route   GET /api/content/grade/:grade
 * @access  Public
 */
const getContentByGrade = async (req, res, next) => {
  try {
    const { grade } = req.params;
    
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
    
    // Get topics for this grade
    const { data: gradeTopics, error: topicsError } = await supabase
      .from('grade_topics')
      .select('topic_id')
      .eq('grade_id', gradeId);
      
    if (topicsError) {
      res.status(404);
      throw new Error('No topics found for this grade');
    }
    
    // Extract topic IDs
    const topicIds = gradeTopics.map(item => item.topic_id);
    
    if (topicIds.length === 0) {
      // Return empty array if no topics found
      return res.json([]);
    }
    
    // Get content for these topics
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .in('topic_id', topicIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error retrieving content: ' + error.message);
    }
    
    // Get topic information for reference
    const { data: topicsData, error: topicDetailsError } = await supabase
      .from('topics')
      .select('id, title')
      .in('id', topicIds);
      
    // Create a map of topic_id to topic title
    const topicMap = {};
    if (!topicDetailsError && topicsData) {
      topicsData.forEach(topic => {
        topicMap[topic.id] = topic.title;
      });
    }
    
    // Add topic titles to the content
    const contentWithTopics = data.map(item => ({
      ...item,
      topic_title: topicMap[item.topic_id] || 'Unknown Topic'
    }));
    
    res.json(contentWithTopics);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate topic summary
 * @route   POST /api/content/summary
 * @access  Public
 */
const generateTopicSummary = async (req, res, next) => {
  try {
    const { topic, grade } = req.body;
    
    if (!topic || !grade) {
      res.status(400);
      throw new Error('Topic and grade are required');
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
    
    // Get topic information
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topic)
      .single();
      
    if (topicError) {
      res.status(404);
      throw new Error('Topic not found');
    }
    
    // Verify topic is associated with this grade
    const { data: gradeTopicData, error: gradeTopicError } = await supabase
      .from('grade_topics')
      .select('*')
      .eq('grade_id', gradeData.id)
      .eq('topic_id', topic)
      .single();
      
    if (gradeTopicError) {
      res.status(404);
      throw new Error('This topic is not available for the specified grade');
    }
    
    // Get relevant content
    const { data: relevantContent } = await supabase
      .from('educational_content')
      .select('title, processed_content')
      .eq('topic_id', topic)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!relevantContent || relevantContent.length === 0) {
      res.status(404);
      throw new Error('No content found for this topic and grade');
    }
    
    // Prepare content for the AI
    let contextData = '';
    relevantContent.forEach(content => {
      contextData += `${content.title}: ${content.processed_content.substring(0, 2000)}\n\n`;
    });
    
    // Generate summary
    const result = await model.generateContent(`
      Create an educational summary about "${topicData.title}" for Guyanese grade ${grade} Social Studies students.
      
      Based on the following educational content:
      ${contextData}
      
      Create a well-structured summary with these sections:
      1. Introduction: Brief explanation of what this topic is about
      2. Key Points: The most important facts and concepts (4-6 bullet points)
      3. Important Vocabulary: Key terms and definitions (3-5 terms)
      4. Summary: A concise paragraph summarizing the topic
      
      Make the language appropriate for grade ${grade} students. Keep your response focused on the factual content
      related to Guyanese Social Studies.
    `);
    
    const summary = result.response.text();
    
    res.json({ 
      topic: topicData.title,
      topic_id: topic,
      grade: parseInt(grade),
      summary 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search content
 * @route   GET /api/content/search
 * @access  Public
 */
const searchContent = async (req, res, next) => {
  try {
    const { query, grade } = req.query;
    
    if (!query) {
      res.status(400);
      throw new Error('Search query is required');
    }
    
    let searchQuery = supabase
      .from('educational_content')
      .select('*, topics:topic_id(title)')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,processed_content.ilike.%${query}%`);
    
    // Filter by grade if provided
    if (grade) {
      // Get the grade_id
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('id')
        .eq('level', parseInt(grade))
        .single();
        
      if (gradeError) {
        res.status(404);
        throw new Error('Grade not found');
      }
      
      // Get topics for this grade
      const { data: gradeTopics, error: topicsError } = await supabase
        .from('grade_topics')
        .select('topic_id')
        .eq('grade_id', gradeData.id);
        
      if (!topicsError && gradeTopics && gradeTopics.length > 0) {
        const topicIds = gradeTopics.map(item => item.topic_id);
        searchQuery = searchQuery.in('topic_id', topicIds);
      }
    }
    
    const { data, error } = await searchQuery.order('created_at', { ascending: false });
    
    if (error) {
      res.status(400);
      throw new Error('Error searching content: ' + error.message);
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate content (quiz, flashcards, educational content) for topic on-the-fly
 * @route   GET /api/content/generate
 * @access  Public
 */
const generateContentOnTheFly = async (req, res, next) => {
  try {
    const { topic_id, grade } = req.query;
    
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
    
    // Return all generated content but don't save it to the database
    // This is suitable for users who are not logged in
    res.json({
      topic: topicData.title,
      grade: grade,
      timestamp: new Date().toISOString(),
      educational_content: learningSet.educational_content,
      quiz: learningSet.quiz,
      flashcard_set: learningSet.flashcard_set
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopics,
  getTopicContent,
  getContentByGrade,
  generateTopicSummary,
  searchContent,
  generateContentOnTheFly
}; 