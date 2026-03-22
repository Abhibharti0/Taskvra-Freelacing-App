const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerificationCode,
  getPublicUser
} = require('../controllers/authController');

const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

/* PUBLIC */
router.post('/register', upload.single('profilePhoto'), register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendVerificationCode);
router.get('/user/:id', getPublicUser);

/* PRIVATE */
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profilePhoto'), updateProfile);

module.exports = router;
