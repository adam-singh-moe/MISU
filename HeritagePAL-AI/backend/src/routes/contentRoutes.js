const express = require('express');
const {
  getTopics,
  getTopicContent,
  getContentByGrade,
  generateTopicSummary,
  searchContent,
  generateContentOnTheFly
} = require('../controllers/contentController');

const router = express.Router();

// Content routes
router.get('/topics', getTopics);
router.get('/topic/:topic', getTopicContent);
router.get('/grade/:grade', getContentByGrade);
router.post('/summary', generateTopicSummary);
router.get('/search', searchContent);
router.get('/generate', generateContentOnTheFly);

module.exports = router; 