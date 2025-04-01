/**
 * Validation Utilities
 * Provides common validation functions
 */

const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Validate request against validation rules
 * @returns {Function} Express middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map(err => err.msg);
  throw new ApiError(extractedErrors.join(', '), 400);
};

/**
 * Validation rules for user registration
 */
const userRegistrationRules = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  
  body('role')
    .isIn(['admin', 'teacher', 'student']).withMessage('Role must be one of: admin, teacher, student')
];

/**
 * Validation rules for user login
 */
const userLoginRules = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for educational content creation
 */
const contentCreationRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required'),
  
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required'),
  
  body('grade')
    .isInt({ min: 1, max: 6 }).withMessage('Grade must be a number between 1 and 6'),
  
  body('raw_content')
    .trim()
    .notEmpty().withMessage('Content is required')
];

/**
 * Validation rules for quiz creation
 */
const quizCreationRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required'),
  
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required'),
  
  body('grade')
    .isInt({ min: 1, max: 6 }).withMessage('Grade must be a number between 1 and 6'),
  
  body('difficulty')
    .isIn(['easy', 'medium', 'challenging']).withMessage('Difficulty must be one of: easy, medium, challenging'),
  
  body('questions')
    .isArray({ min: 1 }).withMessage('Quiz must have at least one question')
];

/**
 * Validation rules for flashcard creation
 */
const flashcardCreationRules = [
  body('term')
    .trim()
    .notEmpty().withMessage('Term is required'),
  
  body('definition')
    .trim()
    .notEmpty().withMessage('Definition is required'),
  
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required'),
  
  body('grade')
    .isInt({ min: 1, max: 6 }).withMessage('Grade must be a number between 1 and 6')
];

/**
 * Validation rules for search queries
 */
const searchQueryRules = [
  query('query')
    .trim()
    .notEmpty().withMessage('Search query is required'),
  
  query('grade')
    .optional()
    .isInt({ min: 1, max: 6 }).withMessage('Grade must be a number between 1 and 6')
];

module.exports = {
  validate,
  userRegistrationRules,
  userLoginRules,
  contentCreationRules,
  quizCreationRules,
  flashcardCreationRules,
  searchQueryRules
}; 