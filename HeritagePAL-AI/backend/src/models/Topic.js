/**
 * Topic Model
 * Represents the structure of topic data in the application
 */

/**
 * @typedef {Object} Topic
 * @property {string} id - Unique identifier
 * @property {string} title - Topic title
 * @property {string} description - Topic description
 * @property {string} content - Main content of the topic
 * @property {string} created_by - Reference to the admin who created the topic
 * @property {Date} created_at - Date when the topic was created
 * @property {Date} updated_at - Date when the topic was last updated
 */

/**
 * @typedef {Object} GradeTopic
 * @property {string} id - Unique identifier
 * @property {string} grade_id - Reference to Grade
 * @property {string} topic_id - Reference to Topic
 * @property {Date} created_at - Date when the relationship was created
 */

/**
 * Validates topic data
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateTopic(data) {
  const errors = [];
  
  // Title validation
  if (!data.title || data.title.trim() === '') {
    errors.push('Topic title is required');
  }
  
  // Content validation
  if (!data.content || data.content.trim() === '') {
    errors.push('Topic content is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates topic assignment to grades
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateTopicGradeAssignment(data) {
  const errors = [];
  
  if (!data.topic_id) {
    errors.push('Topic ID is required');
  }
  
  if (!data.grade_ids || !Array.isArray(data.grade_ids) || data.grade_ids.length === 0) {
    errors.push('At least one grade ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTopic,
  validateTopicGradeAssignment
}; 