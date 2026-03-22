const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const paymentConfig = require('../config/paymentConfig');
const Bid = require('../models/bid');
const Gig = require('../models/gig');

// Create a Razorpay order for a hired bid (client pays freelancer's bid price)
// POST /api/payments/orders/:bidId
// Access: Private (Gig owner)
exports.createOrderForBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const bid = await Bid.findById(bidId).populate('gigId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const gig = bid.gigId;
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

    // Only gig owner can create payment order
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Prevent creating orders for already paid bids
    if (bid.payment?.paid) {
      return res.status(400).json({ success: false, message: 'Payment already completed for this bid' });
    }

    if (bid.status !== 'hired') {
      return res.status(400).json({ success: false, message: 'Bid is not hired yet' });
    }

    // Amount in smallest unit (paise for INR)
    const currency = process.env.RAZORPAY_CURRENCY || 'INR';
    const amount = Number(bid.price);
    const maxLimit = paymentConfig.getCurrentLimit();

    // Check if amount exceeds Razorpay limit
    if (amount > maxLimit) {
      const splitInfo = paymentConfig.calculateSplits(amount);
      return res.status(400).json({
        success: false,
        message: `Amount ${paymentConfig.formatAmount(amount, currency)} exceeds maximum allowed per transaction (${paymentConfig.formatAmount(maxLimit, currency)})`,
        error: 'AMOUNT_EXCEEDS_LIMIT',
        requiresSplit: true,
        splitInfo: {
          totalAmount: amount,
          maxLimit,
          needsSplits: splitInfo.splitCount,
          splits: splitInfo.splits,
          suggestion: `This payment needs to be split into ${splitInfo.splitCount} parts. Use the split payment endpoint.`
        }
      });
    }

    const amountInMinor = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInMinor,
      currency,
      receipt: `bid_${bid._id}`,
      notes: {
        bidId: bid._id.toString(),
        gigId: gig._id.toString(),
        freelancerId: bid.freelancerId.toString(),
        clientId: gig.ownerId.toString()
      }
    });

    // Store order reference on bid for traceability (not marking paid yet)
    await Bid.findByIdAndUpdate(bid._id, {
      $set: {
        'payment.orderId': order.id,
        'payment.amount': Number(bid.price),
        'payment.currency': currency
      }
    });

    res.status(201).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    next(err);
  }
};

// Verify Razorpay payment and mark bid as paid
// POST /api/payments/verify
// Access: Private (Gig owner)
exports.verifyPaymentForBid = async (req, res, next) => {
  try {
    const { bidId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!bidId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing verification fields' });
    }

    const bid = await Bid.findById(bidId).populate('gigId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
    const gig = bid.gigId;
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

    // Only gig owner can verify payment
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Prevent multiple successful payments
    if (bid.payment?.paid) {
      return res.status(400).json({ success: false, message: 'Bid already marked as paid' });
    }

    if (bid.status !== 'hired') {
      return res.status(400).json({ success: false, message: 'Only hired bids can be paid' });
    }

    // If we have an orderId stored, it must match the one being verified
    if (bid.payment?.orderId && bid.payment.orderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Order mismatch for this bid' });
    }

    // Validate signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Mark as paid
    await Bid.findByIdAndUpdate(bid._id, {
      $set: {
        'payment.paid': true,
        'payment.paymentId': razorpay_payment_id,
        'payment.orderId': razorpay_order_id,
        'payment.verifiedAt': new Date()
      }
    });

    res.json({ success: true, message: 'Payment verified and recorded' });
  } catch (err) {
    console.error('Verify Razorpay payment error:', err);
    next(err);
  }
};