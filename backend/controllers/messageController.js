const Message = require('../models/message');
const Conversation = require('../models/conversation');
const Bid = require('../models/bid');

/* ================================
   SEND MESSAGE
================================ */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // AUTH CHECK
    if (
      conversation.clientId.toString() !== req.user._id.toString() &&
      conversation.freelancerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const hasText = content && content.trim();
    const hasFiles = req.files && req.files.length > 0;

    if (!hasText && !hasFiles) {
      return res.status(400).json({
        message: 'Message must contain text or files'
      });
    }

    const receiverId =
      conversation.clientId.toString() === req.user._id.toString()
        ? conversation.freelancerId
        : conversation.clientId;

    /* ================= ATTACHMENTS ================= */
    const attachments = [];
    if (hasFiles) {
      for (const file of req.files) {
        attachments.push({
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          fileUrl: file.secure_url || file.path // Cloudinary safe
        });
      }
    }

    /* ================= CREATE MESSAGE ================= */
    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId,
      content: hasText ? content.trim() : '',
      attachments
    });

    /* ================= UPDATE CONVERSATION ================= */
    const updateData = {
      lastMessage: hasText
        ? content.trim()
        : `Sent ${attachments.length} file(s)`,
      lastMessageAt: new Date()
    };

    if (receiverId.toString() === conversation.clientId.toString()) {
      updateData.clientUnreadCount = (conversation.clientUnreadCount || 0) + 1;
    } else {
      updateData.freelancerUnreadCount =
        (conversation.freelancerUnreadCount || 0) + 1;
    }

    await Conversation.findByIdAndUpdate(conversationId, updateData);

    /* ================= POPULATE SENDER ================= */
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name profilePhoto email')
      .lean();

    /* ================= SOCKET ================= */
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', {
        message: populatedMessage
      });

      io.to(`user_${receiverId}`).emit('message_notification', {
        conversationId,
        senderName: req.user.name,
        messagePreview: hasText
          ? content.trim().slice(0, 100)
          : `Sent ${attachments.length} file(s)`
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET MESSAGES
================================ */
const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (
      conversation.clientId.toString() !== req.user._id.toString() &&
      conversation.freelancerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name profilePhoto email')
      .sort({ createdAt: 1 })
      .lean();

    /* ================= MARK READ ================= */
    await Message.updateMany(
      { conversationId, receiverId: req.user._id, read: false },
      { read: true }
    );

    /* ================= RESET UNREAD ================= */
    if (conversation.clientId.toString() === req.user._id.toString()) {
      await Conversation.findByIdAndUpdate(conversationId, {
        clientUnreadCount: 0
      });
    } else {
      await Conversation.findByIdAndUpdate(conversationId, {
        freelancerUnreadCount: 0
      });
    }

    res.json({
      success: true,
      messages
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET CONVERSATIONS LIST
================================ */
const getConversations = async (req, res, next) => {
  try {
    const { search, status, gigId } = req.query;
    
    const query = {
      $or: [
        { clientId: req.user._id },
        { freelancerId: req.user._id }
      ]
    };

    // Add search filter for gig title or participant names
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add gig filter
    if (gigId) {
      query.gigId = gigId;
    }

    const conversations = await Conversation.find(query)
      .populate('clientId', 'name profilePhoto email')
      .populate('freelancerId', 'name profilePhoto email')
      .populate('gigId', 'title')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    // Add helper info for each conversation
    const enrichedConversations = conversations.map(conv => {
      const isClient = conv.clientId._id.toString() === req.user._id.toString();
      return {
        ...conv,
        otherParticipant: isClient 
          ? { ...conv.freelancerId, role: 'freelancer' }
          : { ...conv.clientId, role: 'client' },
        myUnreadCount: isClient ? conv.clientUnreadCount : conv.freelancerUnreadCount,
        myRole: isClient ? 'client' : 'freelancer'
      };
    });

    res.json({
      success: true,
      conversations: enrichedConversations
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET / CREATE CONVERSATION
================================ */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId)
      .populate('gigId')
      .populate('freelancerId', 'name');
    
    if (!bid || bid.status !== 'hired') {
      return res.status(400).json({ message: 'Invalid bid' });
    }

    // Get client info
    const User = require('../models/user');
    const client = await User.findById(bid.gigId.ownerId).select('name');

    let conversation = await Conversation.findOne({ bidId });

    if (!conversation) {
      conversation = await Conversation.create({
        bidId,
        gigId: bid.gigId._id,
        clientId: bid.gigId.ownerId,
        freelancerId: bid.freelancerId._id,
        gigTitle: bid.gigId.title,
        clientName: client.name,
        freelancerName: bid.freelancerId.name
      });
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('clientId', 'name profilePhoto email')
      .populate('freelancerId', 'name profilePhoto email')
      .populate('gigId', 'title')
      .lean();

    res.json({
      success: true,
      conversation: populatedConversation
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET SINGLE CONVERSATION DETAILS
================================ */
const getConversationDetails = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('clientId', 'name profilePhoto email')
      .populate('freelancerId', 'name profilePhoto email')
      .populate('gigId', 'title budget status')
      .populate('bidId', 'price status')
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Authorization check
    if (
      conversation.clientId._id.toString() !== req.user._id.toString() &&
      conversation.freelancerId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add helper info
    const isClient = conversation.clientId._id.toString() === req.user._id.toString();
    const enrichedConversation = {
      ...conversation,
      otherParticipant: isClient 
        ? { ...conversation.freelancerId, role: 'freelancer' }
        : { ...conversation.clientId, role: 'client' },
      myUnreadCount: isClient ? conversation.clientUnreadCount : conversation.freelancerUnreadCount,
      myRole: isClient ? 'client' : 'freelancer'
    };

    res.json({
      success: true,
      conversation: enrichedConversation
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   ARCHIVE/CLOSE CONVERSATION
================================ */
const updateConversationStatus = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['active', 'closed', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Authorization check
    if (
      conversation.clientId.toString() !== req.user._id.toString() &&
      conversation.freelancerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    conversation.status = status;
    await conversation.save();

    res.json({
      success: true,
      message: `Conversation ${status}`,
      conversation
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET CONVERSATION SUMMARY
================================ */
const getConversationSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get counts
    const totalConversations = await Conversation.countDocuments({
      $or: [{ clientId: userId }, { freelancerId: userId }]
    });

    const activeConversations = await Conversation.countDocuments({
      $or: [{ clientId: userId }, { freelancerId: userId }],
      status: 'active'
    });

    // Get total unread messages
    const conversations = await Conversation.find({
      $or: [{ clientId: userId }, { freelancerId: userId }]
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.clientId.toString() === userId.toString()) {
        totalUnread += conv.clientUnreadCount;
      } else {
        totalUnread += conv.freelancerUnreadCount;
      }
    });

    // Get recent conversations
    const recentConversations = await Conversation.find({
      $or: [{ clientId: userId }, { freelancerId: userId }],
      lastMessageAt: { $ne: null }
    })
      .populate('clientId', 'name profilePhoto')
      .populate('freelancerId', 'name profilePhoto')
      .populate('gigId', 'title')
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      summary: {
        totalConversations,
        activeConversations,
        totalUnread,
        recentConversations
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendMessage,
  getConversationMessages,
  getConversations,
  getOrCreateConversation,
  getConversationDetails,
  updateConversationStatus,
  getConversationSummary
};
