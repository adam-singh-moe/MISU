/**
 * User Model
 * Represents the structure of user data in the application
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} email - User's email address
 * @property {string} password - Hashed password (never sent to client)
 * @property {string} name - User's full name
 * @property {string} role - User role ("admin", "teacher", "student")
 * @property {Date} created_at - Date when the user was created
 * @property {Date} last_login - Date of the user's last login
 */

/**
 * @typedef {Object} Grade
 * @property {string} id - Unique identifier
 * @property {number} level - Grade level (1-6)
 * @property {string} name - Grade name (e.g., "Grade 1") 
 * @property {string} description - Grade description
 */

/**
 * @typedef {Object} UserGrade
 * @property {string} id - Unique identifier
 * @property {string} user_id - Reference to User
 * @property {string} grade_id - Reference to Grade
 * @property {Date} created_at - Date when the relationship was created
 */

/**
 * Validates user data for registration
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateUserRegistration(data) {
  const errors = [];
  
  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email is not valid');
  }
  
  // Password validation - require at least 8 characters with mix of letters and numbers
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(data.password)) {
    errors.push('Password must contain at least one letter and one number');
  }
  
  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  }
  
  // Role validation
  if (!data.role || !['admin', 'teacher', 'student'].includes(data.role)) {
    errors.push('Role must be one of: admin, teacher, student');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user login data
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateUserLogin(data) {
  const errors = [];
  
  if (!data.email || data.email.trim() === '') {
    errors.push('Email is required');
  }
  
  if (!data.password || data.password.trim() === '') {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user grade assignment data
 * @param {Object} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateUserGradeAssignment(data) {
  const errors = [];
  
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  
  if (!data.grade_id) {
    errors.push('Grade ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserGradeAssignment
}; 