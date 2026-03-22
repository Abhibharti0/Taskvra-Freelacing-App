const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });

// One rating per bid (by client)
ratingSchema.index({ bidId: 1 }, { unique: true });
ratingSchema.index({ freelancerId: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);