const express = require('express');
const router = express.Router();

const { chat } = require('../controllers/aiController');

// Public AI chat route (consider protect if you want auth-only)
router.post('/chat', chat);

module.exports = router;
