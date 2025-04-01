const express = require('express');
const {
  getAllQuizzes,
  getQuizById,
  generatePracticeExam,
  submitQuizAnswers,
  getQuizTopics,
} = require('../controllers/quizController');

const router = express.Router();

// Quiz routes
router.get('/', getAllQuizzes);
router.get('/topics', getQuizTopics);
router.post('/practice-exam', generatePracticeExam);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuizAnswers);

module.exports = router; 