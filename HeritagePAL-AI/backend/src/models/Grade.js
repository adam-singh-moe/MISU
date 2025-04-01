/**
 * Grade Model
 * Represents the structure of grade data in the application
 */

/**
 * @typedef {Object} Grade
 * @property {string} id - Unique identifier
 * @property {number} level - Grade level (1-6)
 * @property {string} name - Grade name (e.g., "Grade 1")
 * @property {string} description - Grade description
 * @property {Date} created_at - Date when the grade was created
 * @property {Date} updated_at - Date when the grade was last updated
 */

/**
 * Validates grade data
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateGrade(data) {
  const errors = [];
  
  // Level validation
  if (data.level === undefined || data.level === null) {
    errors.push('Grade level is required');
  } else if (!Number.isInteger(data.level) || data.level < 1 || data.level > 6) {
    errors.push('Grade level must be an integer between 1 and 6');
  }
  
  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.push('Grade name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates topic assignment to grade
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateGradeTopicAssignment(data) {
  const errors = [];
  
  if (!data.grade_id) {
    errors.push('Grade ID is required');
  }
  
  if (!data.topic_id) {
    errors.push('Topic ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateGrade,
  validateGradeTopicAssignment
}; 