const express = require('express');
const router = express.Router();

const gigController = require('../controllers/gigController');
const protect = require('../middleware/authMiddleware');

/* ========= ORDER VERY IMPORTANT ========= */

// Specific route first
router.get('/my-gigs', protect, gigController.getMyGigs);

// Public
router.get('/', gigController.getGigs);
router.get('/:id', gigController.getGig);

// Private
router.post('/', protect, gigController.createGig);

module.exports = router;
