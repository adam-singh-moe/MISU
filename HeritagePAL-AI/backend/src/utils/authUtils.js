/**
 * Authentication Utilities
 * Provides functions for authentication and authorization
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ApiError } = require('./errorHandler');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError('Invalid or expired token', 401);
  }
}

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Express middleware to protect routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @throws {ApiError} If not authenticated
 */
function authenticate(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;
  
  if (!token) {
    throw new ApiError('Authentication required', 401);
  }
  
  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Add user to request
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware to restrict access by role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
function authorize(roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ApiError('Not authorized to access this resource', 403);
    }
    
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticate,
  authorize
}; 