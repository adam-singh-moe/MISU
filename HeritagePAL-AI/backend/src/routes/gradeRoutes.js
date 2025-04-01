const express = require('express');
const router = express.Router();
const {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  assignTopicToGrade,
  removeTopicFromGrade,
  getTopicsForGrade
} = require('../controllers/gradeController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllGrades);
router.get('/:id', getGradeById);
router.get('/:grade_id/topics', getTopicsForGrade);

// Admin-only routes
router.post('/', protect, admin, createGrade);
router.put('/:id', protect, admin, updateGrade);
router.delete('/:id', protect, admin, deleteGrade);

// Topic-grade relationship routes
router.post('/topic-assignment', protect, admin, assignTopicToGrade);
router.delete('/:grade_id/topics/:topic_id', protect, admin, removeTopicFromGrade);

module.exports = router; 