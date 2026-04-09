const Gig = require('../models/gig');

/* ================= GET ALL GIGS ================= */
const getGigs = async (req, res, next) => {
  try {
    const search = req.query.search || '';

    const gigs = await Gig.find({
      title: { $regex: search, $options: 'i' },
      status: 'open', // Only show open gigs in public listing
      moderationStatus: 'approved'
    })
      .populate('ownerId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ success: true, gigs });
  } catch (err) {
    next(err);
  }
};

/* ================= GET SINGLE GIG ================= */
const getGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('ownerId', 'name email profilePhoto');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    res.json({ success: true, gig });
  } catch (err) {
    next(err);
  }
};

/* ================= CREATE GIG ================= */
const createGig = async (req, res, next) => {
  try {
    const { title, description, budget } = req.body;

    const gig = await Gig.create({
      title,
      description,
      budget,
      ownerId: req.user._id,
      moderationStatus: 'approved'
    });

    const populatedGig = await Gig.findById(gig._id)
      .populate('ownerId', 'name email profilePhoto');

    res.status(201).json({
      success: true,
      gig: populatedGig
    });
  } catch (err) {
    next(err);
  }
};

/* ================= GET MY GIGS ================= */
const getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ ownerId: req.user._id })
      .populate('ownerId', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ success: true, gigs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGigs,
  getGig,
  createGig,
  getMyGigs
};
