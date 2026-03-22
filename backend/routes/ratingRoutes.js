const express = require('express');
const { upsertRatingForBid, getRatingForBid, getRatingsForFreelancer } = require('../controllers/ratingController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Create/update rating for a bid (client only)
router.post('/:bidId', protect, upsertRatingForBid);

// Get rating for a bid
router.get('/bid/:bidId', protect, getRatingForBid);

// Get ratings for a freelancer
router.get('/freelancer/:freelancerId', protect, getRatingsForFreelancer);

module.exports = router;