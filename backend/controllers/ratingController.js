const Rating = require('../models/rating');
const Bid = require('../models/bid');
const User = require('../models/user');

// Helper to recompute freelancer aggregates
async function recomputeFreelancerRating(freelancerId) {
  const agg = await Rating.aggregate([
    { $match: { freelancerId: freelancerId } },
    { $group: { _id: '$freelancerId', avg: { $avg: '$stars' }, count: { $sum: 1 } } }
  ]);
  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await User.findByIdAndUpdate(freelancerId, { ratingAvg: avg, ratingCount: count });
}

// Create or update a rating for a hired bid (client only)
// POST /api/ratings/:bidId
exports.upsertRatingForBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const { stars, comment } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Stars must be 1-5' });
    }

    const bid = await Bid.findById(bidId).populate('gigId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
    const gig = bid.gigId;
    if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

    // Only gig owner can rate
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate' });
    }

    if (bid.status !== 'hired') {
      return res.status(400).json({ success: false, message: 'Only hired bids can be rated' });
    }

    const payload = {
      bidId: bid._id,
      gigId: gig._id,
      freelancerId: bid.freelancerId,
      clientId: gig.ownerId,
      stars,
      comment: comment || ''
    };

    const rating = await Rating.findOneAndUpdate(
      { bidId: bid._id },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update freelancer aggregates
    await recomputeFreelancerRating(bid.freelancerId);

    res.status(200).json({ success: true, rating });
  } catch (err) {
    next(err);
  }
};

// Get rating for a specific bid
// GET /api/ratings/bid/:bidId
exports.getRatingForBid = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    const rating = await Rating.findOne({ bidId });
    res.json({ success: true, rating });
  } catch (err) {
    next(err);
  }
};

// Get ratings for a freelancer with aggregates
// GET /api/ratings/freelancer/:freelancerId
exports.getRatingsForFreelancer = async (req, res, next) => {
  try {
    const { freelancerId } = req.params;
    const ratings = await Rating.find({ freelancerId }).sort({ createdAt: -1 }).lean();
    const user = await User.findById(freelancerId).lean();
    res.json({ success: true, ratings, avg: user?.ratingAvg || 0, count: user?.ratingCount || 0 });
  } catch (err) {
    next(err);
  }
};