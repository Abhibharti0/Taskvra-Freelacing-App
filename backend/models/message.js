const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  attachments: [
    {
      fileName: {
        type: String,
        required: true
      },
      fileSize: {
        type: Number,
        required: true
      },
      fileType: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Require either content or attachments
messageSchema.pre('save', function(next) {
  if (!this.content || !this.content.trim()) {
    if (!this.attachments || this.attachments.length === 0) {
      return next(new Error('Message must have either text content or attachments'));
    }
  }
  next();
});

// Index for efficient conversation queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
