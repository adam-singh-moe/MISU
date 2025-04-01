const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  uploadContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  generateQuiz,
} = require('../controllers/adminController');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(admin);

// Content management routes
router.route('/content')
  .post(upload.single('file'), uploadContent)
  .get(getAllContent);

router.route('/content/:id')
  .get(getContentById)
  .put(updateContent)
  .delete(deleteContent);

// Quiz generation route
router.post('/content/:id/generate-quiz', generateQuiz);

module.exports = router; 