const express = require('express');
const {
  getFlashcards,
  getFlashcardSetById,
  generateFlashcards,
  getFlashcardSets,
  getFlashcardTopics,
  getFlashcardHistory
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getFlashcards);
router.get('/sets', getFlashcardSets);
router.get('/topics', getFlashcardTopics);
router.post('/generate', generateFlashcards);
router.get('/set/:id', getFlashcardSetById);

// Protected routes (require authentication)
router.get('/history', protect, getFlashcardHistory);

module.exports = router; 