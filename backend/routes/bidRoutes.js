const express = require('express');

const {
  submitBid,
  getBidsForGig,
  hireBid,
  getMyBids,
  resendHireEmail
} = require('../controllers/bidController');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Submit a bid
router.post('/', protect, submitBid);

// Get my bids
router.get('/my-bids', protect, getMyBids);

// Get bids for a gig (owner only)
router.get('/:gigId', protect, getBidsForGig);

// Hire a freelancer
router.patch('/:bidId/hire', protect, hireBid);

// Resend hire email notification
router.post('/:bidId/resend-email', protect, resendHireEmail);

module.exports = router;
