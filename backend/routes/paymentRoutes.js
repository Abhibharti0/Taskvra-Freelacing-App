const express = require('express');
const { createOrderForBid, verifyPaymentForBid } = require('../controllers/paymentController');
const { 
  createSplitOrders, 
  verifySplitPayment, 
  getSplitPaymentStatus 
} = require('../controllers/paymentSplitController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Regular payment (for amounts within Razorpay limits)
router.post('/orders/:bidId', protect, createOrderForBid);
router.post('/verify', protect, verifyPaymentForBid);

// Split payment (for large amounts exceeding Razorpay limits)
router.post('/split-orders/:bidId', protect, createSplitOrders);
router.post('/verify-split', protect, verifySplitPayment);
router.get('/split-status/:bidId', protect, getSplitPaymentStatus);

module.exports = router;