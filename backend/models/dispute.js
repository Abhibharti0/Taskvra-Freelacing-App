const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true,
    index: true
  },
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
    index: true
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  againstUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  evidence: [{
    fileName: { type: String, default: null },
    fileUrl: { type: String, default: null },
    note: { type: String, default: null }
  }],
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'rejected'],
    default: 'open'
  },
  resolutionType: {
    type: String,
    enum: ['none', 'refund', 'release_payment', 'partial_refund', 'close_case'],
    default: 'none'
  },
  resolutionNote: {
    type: String,
    default: null,
    trim: true,
    maxlength: [1000, 'Resolution note cannot exceed 1000 characters']
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

disputeSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', disputeSchema);