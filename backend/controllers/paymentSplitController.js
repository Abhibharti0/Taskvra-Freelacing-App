const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const paymentConfig = require('../config/paymentConfig');
const Bid = require('../models/bid');
const Gig = require('../models/gig');

/**
 * Calculate payment splits for amounts exceeding Razorpay limits
 * @param {number} totalAmount - Total amount to pay
 * @returns {Array} Array of split amounts
 */
const calculatePaymentSplits = (totalAmount) => {
  const result = paymentConfig.calculateSplits(totalAmount);
  return result.splits;
};

/**
 * Create multiple Razorpay orders for large payments
 * POST /api/payments/split-orders/:bidId
 * Access: Private (Gig owner)
 */
exports.createSplitOrders = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const bid = await Bid.findById(bidId).populate('gigId');
    
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const gig = bid.gigId;
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Authorization check
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if already paid
    if (bid.payment?.paid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already completed for this bid' 
      });
    }

    if (bid.status !== 'hired') {
      return res.status(400).json({ 
        success: false, 
        message: 'Bid is not hired yet' 
      });
    }

    const totalAmount = Number(bid.price);
    const currency = process.env.RAZORPAY_CURRENCY || 'INR';
    const maxLimit = paymentConfig.getCurrentLimit();

    // Check if split is needed
    if (totalAmount <= maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Amount ${paymentConfig.formatAmount(totalAmount, currency)} doesn't require splitting. Use regular payment.`,
        useRegularPayment: true
      });
    }

    // Calculate splits
    const splits = calculatePaymentSplits(totalAmount);
    
    // Create orders for each split
    const orders = [];
    for (let i = 0; i < splits.length; i++) {
      const splitAmount = splits[i];
      const amountInMinor = Math.round(splitAmount * 100); // Convert to paise

      const order = await razorpay.orders.create({
        amount: amountInMinor,
        currency,
        receipt: `bid_${bid._id}_part${i + 1}_of_${splits.length}`,
        notes: {
          bidId: bid._id.toString(),
          gigId: gig._id.toString(),
          freelancerId: bid.freelancerId.toString(),
          clientId: gig.ownerId.toString(),
          splitIndex: i + 1,
          totalSplits: splits.length,
          totalAmount: totalAmount
        }
      });

      orders.push({
        orderId: order.id,
        amount: splitAmount,
        amountInMinor,
        currency,
        partNumber: i + 1,
        totalParts: splits.length
      });
    }

    // Store split order info
    await Bid.findByIdAndUpdate(bid._id, {
      $set: {
        'payment.splitOrders': orders.map(o => ({
          orderId: o.orderId,
          amount: o.amount,
          paid: false
        })),
        'payment.totalAmount': totalAmount,
        'payment.currency': currency,
        'payment.requiresSplit': true
      }
    });

    res.status(201).json({
      success: true,
      message: `Payment split into ${splits.length} parts`,
      totalAmount,
      splits: orders,
      keyId: process.env.RAZORPAY_KEY_ID,
      instructions: `Complete ${splits.length} payments of the amounts shown. Payment will be marked complete after all parts are verified.`
    });
  } catch (err) {
    console.error('Create split orders error:', err);
    next(err);
  }
};

/**
 * Verify split payment
 * POST /api/payments/verify-split
 * Access: Private (Gig owner)
 */
exports.verifySplitPayment = async (req, res, next) => {
  try {
    const { 
      bidId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      partNumber 
    } = req.body;

    if (!bidId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !partNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing verification fields' 
      });
    }

    const bid = await Bid.findById(bidId).populate('gigId');
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const gig = bid.gigId;
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Authorization check
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (bid.status !== 'hired') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only hired bids can be paid' 
      });
    }

    // Validate signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
    }

    // Find the specific split order
    const splitOrders = bid.payment?.splitOrders || [];
    const splitIndex = splitOrders.findIndex(
      (order) => order.orderId === razorpay_order_id
    );

    if (splitIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order not found in split payments' 
      });
    }

    // Mark this split as paid
    splitOrders[splitIndex].paid = true;
    splitOrders[splitIndex].paymentId = razorpay_payment_id;
    splitOrders[splitIndex].verifiedAt = new Date();

    // Check if all splits are paid
    const allPaid = splitOrders.every(order => order.paid);

    await Bid.findByIdAndUpdate(bid._id, {
      $set: {
        'payment.splitOrders': splitOrders,
        'payment.paid': allPaid,
        'payment.partiallyPaid': !allPaid,
        'payment.lastPaymentAt': new Date()
      }
    });

    const remainingPayments = splitOrders.filter(order => !order.paid).length;

    res.json({ 
      success: true, 
      message: allPaid 
        ? 'All payments completed! Bid fully paid.' 
        : `Payment ${partNumber} verified. ${remainingPayments} more payment(s) remaining.`,
      allPaid,
      remainingPayments,
      totalParts: splitOrders.length
    });
  } catch (err) {
    console.error('Verify split payment error:', err);
    next(err);
  }
};

/**
 * Get payment status for split payments
 * GET /api/payments/split-status/:bidId
 * Access: Private
 */
exports.getSplitPaymentStatus = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const bid = await Bid.findById(bidId).populate('gigId');

    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    // Authorization check
    const gig = bid.gigId;
    if (
      gig.ownerId.toString() !== req.user._id.toString() &&
      bid.freelancerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!bid.payment?.requiresSplit) {
      return res.status(400).json({
        success: false,
        message: 'This bid does not have split payments'
      });
    }

    const splitOrders = bid.payment.splitOrders || [];
    const paidCount = splitOrders.filter(order => order.paid).length;
    const totalAmount = bid.payment.totalAmount || bid.price;
    const paidAmount = splitOrders
      .filter(order => order.paid)
      .reduce((sum, order) => sum + order.amount, 0);

    res.json({
      success: true,
      payment: {
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
        totalParts: splitOrders.length,
        paidParts: paidCount,
        remainingParts: splitOrders.length - paidCount,
        fullyPaid: bid.payment.paid || false,
        splits: splitOrders.map(order => ({
          orderId: order.orderId,
          amount: order.amount,
          paid: order.paid,
          paymentId: order.paymentId,
          verifiedAt: order.verifiedAt
        }))
      }
    });
  } catch (err) {
    console.error('Get split payment status error:', err);
    next(err);
  }
};
