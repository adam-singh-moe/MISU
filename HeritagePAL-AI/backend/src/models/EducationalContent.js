/**
 * Educational Content Model
 * Represents the structure of educational content in the application
 */

/**
 * @typedef {Object} EducationalContent
 * @property {string} id - Unique identifier
 * @property {string} title - Content title
 * @property {string} description - Brief description
 * @property {string} topic - Topic category (e.g., "Geography", "History")
 * @property {number} grade - Grade level (1-6)
 * @property {string} source - Source of the content (e.g., "Official Textbook")
 * @property {string} raw_content - Original unprocessed content
 * @property {string} processed_content - Content after AI processing
 * @property {string[]} [keywords] - Array of keywords related to the content
 * @property {Date} created_at - Date when the content was created
 * @property {Date} updated_at - Date when the content was last updated
 */

/**
 * Validates educational content data
 * @param {EducationalContent} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateEducationalContent(data) {
  const errors = [];

  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!data.topic || data.topic.trim() === '') {
    errors.push('Topic is required');
  }

  if (!data.grade || isNaN(data.grade) || data.grade < 1 || data.grade > 6) {
    errors.push('Grade must be a number between 1 and 6');
  }

  if (!data.raw_content || data.raw_content.trim() === '') {
    errors.push('Content is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateEducationalContent
}; 