const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  assignGradeToUser,
  removeGradeFromUser,
  getUserGrades,
  getLearningHistory,
  createLearningSession,
  getUserLearningHistory
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.get('/learning-history', protect, getLearningHistory);
router.get('/learning-sessions', protect, getUserLearningHistory);
router.post('/learning-session', protect, createLearningSession);

// Grade-related routes
router.post('/:id/grades', protect, assignGradeToUser);
router.delete('/:id/grades/:grade_id', protect, removeGradeFromUser);
router.get('/:id/grades', protect, getUserGrades);

module.exports = router; 