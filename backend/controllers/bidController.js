const mongoose = require('mongoose');
const Bid = require('../models/bid');
const Gig = require('../models/gig');
const Conversation = require('../models/conversation');
const PlatformSetting = require('../models/platformSetting');
const { sendEmail } = require('../utils/email');

// @desc    Submit a bid
// @route   POST /api/bids
// @access  Private
const submitBid = async (req, res, next) => {
  try {
    const { gigId, message, price } = req.body;

    // Only freelancers or users with both roles can submit bids
    if (req.user.role === 'client') {
      return res.status(403).json({
        success: false,
        message: 'Clients cannot submit bids'
      });
    }

    if (req.user.freelancerApprovalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your freelancer profile is pending approval'
      });
    }

    if (req.user.freelancerApprovalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your freelancer profile was rejected'
      });
    }

    // Validate input
    if (!gigId || !message || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide gigId, message, and price'
      });
    }

    // Check if gig exists and is open
    const gig = await Gig.findById(gigId);
    
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This gig is no longer accepting bids'
      });
    }

    if (gig.moderationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This gig is not available'
      });
    }

    const settings = await PlatformSetting.findOne().lean();
    const minBidAmount = settings?.minBidAmount || 1;
    const maxBidsPerGig = settings?.maxBidsPerGig || 50;
    const maxBidsPerFreelancerPerDay = settings?.maxBidsPerFreelancerPerDay || 20;

    if (Number(price) < minBidAmount) {
      return res.status(400).json({
        success: false,
        message: `Bid price must be at least ${minBidAmount}`
      });
    }

    const [gigBidCount, freelancerDailyCount] = await Promise.all([
      Bid.countDocuments({ gigId, status: { $in: ['pending', 'hired'] } }),
      Bid.countDocuments({
        freelancerId: req.user._id,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    if (gigBidCount >= maxBidsPerGig) {
      return res.status(400).json({
        success: false,
        message: 'This gig has reached the maximum number of bids'
      });
    }

    if (freelancerDailyCount >= maxBidsPerFreelancerPerDay) {
      return res.status(400).json({
        success: false,
        message: 'You have reached your daily bid limit'
      });
    }

    // Prevent gig owner from bidding on their own gig
    if (gig.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own gig'
      });
    }

    // Create bid
    const bid = await Bid.create({
      gigId,
      freelancerId: req.user._id,
      message,
      price
    });

    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      bid: populatedBid
    });
  } catch (error) {
    // Handle duplicate bid error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a bid for this gig'
      });
    }
    next(error);
  }
};

// @desc    Get bids for a gig
// @route   GET /api/bids/:gigId
// @access  Private (Gig owner only)
const getBidsForGig = async (req, res, next) => {
  try {
    const { gigId } = req.params;

    // Check if gig exists
    const gig = await Gig.findById(gigId);
    
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    // Verify user is gig owner
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bids for this gig'
      });
    }

    const bids = await Bid.find({ gigId })
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Hire a freelancer for a gig
// @route   PATCH /api/bids/:bidId/hire
// @access  Private (Gig owner only)
const hireBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;

    //  Find bid and its gig
    const bid = await Bid.findById(bidId).populate('gigId');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    const gig = bid.gigId;

    //  Verify user is gig owner
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - You are not the gig owner'
      });
    }

    //  Check if gig is  open (prevent double hiring)
    if (gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This gig has already been assigned'
      });
    }

    //  Perform  updates
    await Gig.findOneAndUpdate(
      { _id: gig._id, status: 'open' }, // ensure  open
      {
        status: 'assigned',
        hiredBidId: bidId
      }
    );

    await Bid.findOneAndUpdate(
      { _id: bidId, status: 'pending' },
      { status: 'hired' }
    );

    await Bid.updateMany(
      {
        gigId: gig._id,
        _id: { $ne: bidId },
        status: 'pending'
      },
      { status: 'rejected' }
    );

    // Get updated bid with populated fields for response + socket
    const updatedBid = await Bid.findById(bidId)
      .populate('freelancerId', 'name email')
      .populate('gigId', 'title')
      .lean();

    // Create conversation for messaging with cached data
    try {
      const existingConversation = await Conversation.findOne({ bidId });
      if (!existingConversation) {
        // Get user names for cached conversation data
        const User = require('../models/user');
        const [client, freelancer] = await Promise.all([
          User.findById(gig.ownerId).select('name'),
          User.findById(bid.freelancerId).select('name')
        ]);

        await Conversation.create({
          bidId,
          gigId: gig._id,
          clientId: gig.ownerId,
          freelancerId: bid.freelancerId,
          gigTitle: gig.title,
          clientName: client?.name || 'Client',
          freelancerName: freelancer?.name || 'Freelancer'
        });
      }
    } catch (convError) {
      console.error('Error creating conversation:', convError);
      // Don't fail the hire if conversation creation fails
    }

    // Emit socket event 
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updatedBid.freelancerId._id}`).emit('hired', {
        message: `You have been hired for "${updatedBid.gigId.title}"!`,
        gigTitle: updatedBid.gigId.title,
        gigId: updatedBid.gigId._id,
        bidId: updatedBid._id
      });
    }

    // Send email notification to the freelancer
    try {
      const to = updatedBid.freelancerId.email;
      if (to) {
        const subject = `You're hired for "${updatedBid.gigId.title}"`;
        const text = `Congrats! You've been hired for the gig "${updatedBid.gigId.title}".\n\nBid Amount: $${updatedBid.price}\n\nYou can now chat with the client in Taskvra Messages.`;
        const html = `
          <h2>You're hired! 🎉</h2>
          <p>You've been hired for the gig <b>${updatedBid.gigId.title}</b>.</p>
          <p><b>Bid Amount:</b> $${updatedBid.price}</p>
          <p>Head over to <b>Messages</b> in Taskvra to coordinate with the client.</p>
        `;
        await sendEmail({ to, subject, text, html });
      }
    } catch (mailErr) {
      console.error('Failed to send hire email:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Freelancer hired successfully',
      bid: updatedBid
    });

  } catch (error) {
    console.error('Hire transaction error:', error);
    next(error);
  }
};

// @desc    Get user's bids
// @route   GET /api/bids/my-bids
// @access  Private
const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ freelancerId: req.user._id })
      .populate({
        path: 'gigId',
        select: 'title budget status ownerId',
        populate: {
          path: 'ownerId',
          select: 'name email profilePhoto'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitBid,
  getBidsForGig,
  hireBid,
  getMyBids,
  // Allow resending hire email notification
  resendHireEmail: async (req, res, next) => {
    try {
      const { bidId } = req.params;
      const bid = await Bid.findById(bidId).populate('gigId').populate('freelancerId', 'name email');
      if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
      if (bid.status !== 'hired') return res.status(400).json({ success: false, message: 'Bid is not hired' });

      // Only gig owner or the freelancer can trigger resend
      const isOwner = bid.gigId.ownerId.toString() === req.user._id.toString();
      const isFreelancer = bid.freelancerId._id.toString() === req.user._id.toString();
      if (!isOwner && !isFreelancer) return res.status(403).json({ success: false, message: 'Not authorized to resend' });

      const to = bid.freelancerId.email;
      if (!to) return res.status(400).json({ success: false, message: 'Freelancer email not available' });

      const subject = `You're hired for "${bid.gigId.title}"`;
      const text = `Congrats! You've been hired for the gig "${bid.gigId.title}". You can now chat with the client in Taskvra Messages.`;
      const html = `
        <h2>You're hired! 🎉</h2>
        <p>You've been hired for the gig <b>${bid.gigId.title}</b>.</p>
        <p>Head over to <b>Messages</b> in Taskvra to coordinate with the client.</p>
      `;
      await sendEmail({ to, subject, text, html });
      res.json({ success: true, message: 'Hire email resent' });
    } catch (err) {
      console.error('Resend hire email failed:', err.message);
      next(err);
    }
  }
};