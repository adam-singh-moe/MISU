const express = require('express');
const { loginAdmin, registerAdmin, getAdminProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin authentication routes
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.get('/profile', protect, getAdminProfile);

module.exports = router; 