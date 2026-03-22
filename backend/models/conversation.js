const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true,
    unique: true,
    index: true
  },
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Cached data for faster retrieval without populating
  gigTitle: {
    type: String,
    required: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  freelancerName: {
    type: String,
    required: true,
    trim: true
  },
  lastMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Last message preview cannot exceed 500 characters']
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  clientUnreadCount: {
    type: Number,
    default: 0
  },
  freelancerUnreadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for finding conversations by user
conversationSchema.index({ clientId: 1, freelancerId: 1 });
conversationSchema.index({ clientId: 1, lastMessageAt: -1 });
conversationSchema.index({ freelancerId: 1, lastMessageAt: -1 });
conversationSchema.index({ gigTitle: 'text', clientName: 'text', freelancerName: 'text' });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

// Instance method to get the other participant's info for a given user
conversationSchema.methods.getOtherParticipant = function(userId) {
  const userIdStr = userId.toString();
  if (this.clientId.toString() === userIdStr) {
    return {
      id: this.freelancerId,
      name: this.freelancerName,
      role: 'freelancer'
    };
  } else {
    return {
      id: this.clientId,
      name: this.clientName,
      role: 'client'
    };
  }
};

// Instance method to get unread count for a specific user
conversationSchema.methods.getUnreadCount = function(userId) {
  const userIdStr = userId.toString();
  if (this.clientId.toString() === userIdStr) {
    return this.clientUnreadCount;
  } else {
    return this.freelancerUnreadCount;
  }
};

// Static method to search conversations
conversationSchema.statics.searchByUser = async function(userId, searchQuery, filters = {}) {
  const query = {
    $or: [
      { clientId: userId },
      { freelancerId: userId }
    ]
  };

  // Add search text if provided
  if (searchQuery && searchQuery.trim()) {
    query.$text = { $search: searchQuery };
  }

  // Add status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Add gig filter
  if (filters.gigId) {
    query.gigId = filters.gigId;
  }

  return this.find(query)
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .limit(filters.limit || 50);
};

module.exports = mongoose.model('Conversation', conversationSchema);
