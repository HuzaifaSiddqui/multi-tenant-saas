const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Auth rate limiter to protect against brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
