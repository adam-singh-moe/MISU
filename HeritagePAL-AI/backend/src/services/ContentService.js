/**
 * Content Service
 * Manages operations related to educational content
 */

const { supabase } = require('../config/supabaseConfig');
const AIService = require('./AIService');
const { validateEducationalContent } = require('../models/EducationalContent');

/**
 * Retrieve topics from the database
 * @returns {Promise<string[]>} Array of unique topics
 */
async function getTopics() {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('topic')
      .order('topic');
    
    if (error) {
      console.error('Error retrieving topics:', error.message);
      return [];
    }
    
    // Extract unique topics
    const uniqueTopics = data && data.length > 0 ? [...new Set(data.map(item => item.topic))] : [];
    return uniqueTopics;
  } catch (error) {
    console.error('Exception in getTopics:', error);
    return [];
  }
}

/**
 * Retrieve content for a specific topic
 * @param {string} topic - The topic to retrieve content for
 * @param {number} [grade] - Optional grade level filter
 * @returns {Promise<Array>} Array of content items
 */
async function getTopicContent(topic, grade) {
  try {
    let query = supabase
      .from('educational_content')
      .select('*')
      .eq('topic', topic);
    
    // Filter by grade if provided
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error retrieving content:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getTopicContent:', error);
    return [];
  }
}

/**
 * Retrieve content by grade level
 * @param {number} grade - The grade level
 * @returns {Promise<Array>} Array of content items
 */
async function getContentByGrade(grade) {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('grade', parseInt(grade))
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error retrieving content by grade:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getContentByGrade:', error);
    return [];
  }
}

/**
 * Generate a summary for a topic using AI
 * @param {string} topic - The topic to summarize
 * @param {number} grade - The grade level
 * @returns {Promise<Object>} The generated summary
 */
async function generateTopicSummary(topic, grade) {
  try {
    // Get relevant content for context
    const relevantContent = await getTopicContent(topic, grade);
    
    if (!relevantContent || relevantContent.length === 0) {
      return { error: 'No content found for this topic and grade' };
    }
    
    // Prepare content for the AI
    let contextData = '';
    relevantContent.forEach(content => {
      contextData += `${content.title}: ${content.processed_content.substring(0, 2000)}\n\n`;
    });
    
    // Generate summary using AI service
    const summary = await AIService.generateContentSummary(topic, grade, contextData);
    
    return { 
      topic,
      grade: parseInt(grade),
      summary
    };
  } catch (error) {
    console.error('Error generating topic summary:', error);
    return { error: error.message || 'Failed to generate summary' };
  }
}

/**
 * Search for content based on query
 * @param {string} query - The search query
 * @param {number} [grade] - Optional grade level filter
 * @returns {Promise<Array>} Array of matching content items
 */
async function searchContent(query, grade) {
  try {
    let searchQuery = supabase
      .from('educational_content')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,processed_content.ilike.%${query}%`);
    
    // Filter by grade if provided
    if (grade) {
      searchQuery = searchQuery.eq('grade', parseInt(grade));
    }
    
    const { data, error } = await searchQuery.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching content:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in searchContent:', error);
    return [];
  }
}

/**
 * Create new educational content with AI processing
 * @param {Object} contentData - The content data
 * @returns {Promise<Object>} The created content
 */
async function createContent(contentData) {
  try {
    // Validate the content data
    const validation = validateEducationalContent(contentData);
    if (!validation.isValid) {
      return { error: validation.errors.join(', ') };
    }
    
    // Process the raw content with AI
    const processedContent = await AIService.processEducationalContent(
      contentData.raw_content,
      contentData.topic,
      contentData.grade
    );
    
    // Prepare the data for insertion
    const dataToInsert = {
      ...contentData,
      processed_content: processedContent,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('educational_content')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating content:', error.message);
      return { error: error.message };
    }
    
    return data;
  } catch (error) {
    console.error('Exception in createContent:', error);
    return { error: error.message || 'Failed to create content' };
  }
}

module.exports = {
  getTopics,
  getTopicContent,
  getContentByGrade,
  generateTopicSummary,
  searchContent,
  createContent
}; 