const express = require('express');
const {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  recordTopicView,
  assignTopicToGrades,
  getTopicGrades
} = require('../controllers/topicController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllTopics);
router.get('/:id', getTopicById);
router.get('/:id/grades', getTopicGrades);

// Protected routes (require authentication)
router.post('/:id/view', protect, recordTopicView);

// Admin-only routes (require admin privileges)
router.post('/', protect, admin, createTopic);
router.put('/:id', protect, admin, updateTopic);
router.delete('/:id', protect, admin, deleteTopic);
router.post('/:id/grades', protect, admin, assignTopicToGrades);

module.exports = router; 