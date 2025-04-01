const express = require('express');
const { getChatResponse, getChatHistory } = require('../controllers/chatController');

const router = express.Router();

// Chat routes
router.post('/message', getChatResponse);
router.get('/history/:sessionId', getChatHistory);

module.exports = router; 