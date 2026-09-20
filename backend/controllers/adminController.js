const mongoose = require('mongoose');
const User = require('../models/user');
const Gig = require('../models/gig');
const Bid = require('../models/bid');
const Rating = require('../models/rating');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Dispute = require('../models/dispute');
const WithdrawalRequest = require('../models/withdrawalRequest');
const PlatformSetting = require('../models/platformSetting');
const Announcement = require('../models/announcement');
const AdminActivityLog = require('../models/adminActivityLog');
const { sendEmail } = require('../utils/email');

const getSettings = async () => {
  let settings = await PlatformSetting.findOne().lean();
  if (!settings) {
    settings = await PlatformSetting.create({});
    settings = settings.toObject();
  }
  return settings;
};

const recordActivity = async (req, payload) => {
  try {
    await AdminActivityLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      description: payload.description,
      metadata: payload.metadata || {},
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null,
      userAgent: req.headers['user-agent'] || null
    });
  } catch (error) {
    console.error('Failed to record admin activity:', error.message);
  }
};

const buildPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getMonthlySeries = async (model, match, dateField, valueField = null, months = 6) => {
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const pipeline = [
    { $match: { ...match, [dateField]: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: `$${dateField}` },
          month: { $month: `$${dateField}` }
        },
        count: { $sum: 1 },
        total: valueField ? { $sum: `$${valueField}` } : { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];

  const data = await model.aggregate(pipeline);
  const series = [];

  for (let index = 0; index < months; index += 1) {
    const current = new Date(start);
    current.setMonth(start.getMonth() + index);
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const point = data.find((item) => item._id.year === year && item._id.month === month);
    series.push({
      label: current.toLocaleString('en-US', { month: 'short' }),
      count: point?.count || 0,
      total: point?.total || 0
    });
  }

  return series;
};

const detectSpamScore = async (bid) => {
  const [todayCount, repeatedCount, shortMessagePenalty] = await Promise.all([
    Bid.countDocuments({
      freelancerId: bid.freelancerId,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }),
    Bid.countDocuments({
      freelancerId: bid.freelancerId,
      gigId: bid.gigId,
      price: bid.price
    }),
    Promise.resolve((bid.message || '').trim().length < 30 ? 15 : 0)
  ]);

  let score = 0;
  const reasons = [];

  if (todayCount > 10) {
    score += 25;
    reasons.push('High bid volume today');
  }

  if (repeatedCount > 1) {
    score += 25;
    reasons.push('Repeated bid pricing on the same gig');
  }

  score += shortMessagePenalty;
  if (shortMessagePenalty > 0) {
    reasons.push('Very short bid message');
  }

  if (bid.price <= 1) {
    score += 20;
    reasons.push('Suspiciously low bid price');
  }

  if ((bid.message || '').match(/http[s]?:\/\//i)) {
    score += 10;
    reasons.push('Contains external links');
  }

  return { riskScore: Math.min(score, 100), reasons };
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePhoto: req.user.profilePhoto
    }
  });
};

exports.getDashboard = async (req, res, next) => {
  try {
    const settings = await getSettings();

    const [
      totalUsers,
      totalClients,
      totalFreelancers,
      totalAdmins,
      activeProjects,
      openProjects,
      completedProjects,
      paidBids,
      totalEarnings,
      totalCommission,
      recentUsers,
      recentProjects,
      recentPayments,
      revenueSeries,
      growthSeries,
      topFreelancers,
      topClients,
      recentActivityLogs
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['client'] } }),
      User.countDocuments({ role: { $in: ['freelancer', 'both'] } }),
      User.countDocuments({ role: { $in: ['admin', 'moderator'] } }),
      Gig.countDocuments({ status: { $in: ['open', 'assigned'] }, moderationStatus: { $ne: 'rejected' } }),
      Gig.countDocuments({ status: 'open', moderationStatus: { $ne: 'rejected' } }),
      Gig.countDocuments({ status: 'assigned', moderationStatus: { $ne: 'rejected' } }),
      Bid.countDocuments({ 'payment.paid': true }),
      Bid.aggregate([
        { $match: { 'payment.paid': true } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      Bid.aggregate([
        { $match: { 'payment.paid': true } },
        {
          $group: {
            _id: null,
            total: { $sum: '$payment.amount' },
            commission: { $sum: { $multiply: ['$payment.amount', settings.platformCommissionPercent / 100] } }
          }
        }
      ]),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role createdAt isBanned freelancerApprovalStatus').lean(),
      Gig.find({ moderationStatus: { $ne: 'rejected' } }).sort({ createdAt: -1 }).limit(5).populate('ownerId', 'name email').lean(),
      Bid.find({ 'payment.paid': true }).sort({ 'payment.verifiedAt': -1, createdAt: -1 }).limit(5).populate('freelancerId', 'name email').populate('gigId', 'title').lean(),
      getMonthlySeries(User, {}, 'createdAt'),
      getMonthlySeries(Bid, { 'payment.paid': true }, 'createdAt', 'payment.amount'),
      User.aggregate([
        { $match: { role: { $in: ['freelancer', 'both'] }, ratingCount: { $gt: 0 } } },
        { $sort: { ratingAvg: -1, ratingCount: -1 } },
        { $limit: 5 },
        { $project: { name: 1, email: 1, profilePhoto: 1, ratingAvg: 1, ratingCount: 1 } }
      ]),
      User.aggregate([
        { $match: { role: { $in: ['client', 'both'] } } },
        { $lookup: { from: 'gigs', localField: '_id', foreignField: 'ownerId', as: 'gigs' } },
        { $project: { name: 1, email: 1, profilePhoto: 1, gigsCreated: { $size: '$gigs' } } },
        { $sort: { gigsCreated: -1 } },
        { $limit: 5 }
      ]),
      AdminActivityLog.find({}).sort({ createdAt: -1 }).limit(8).populate('actorId', 'name email role').lean()
    ]);

    const earningsTotal = totalEarnings[0]?.total || 0;
    const commissionTotal = totalCommission[0]?.commission || 0;

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalUsers,
          totalClients,
          totalFreelancers,
          totalAdmins,
          activeProjects,
          openProjects,
          completedProjects,
          paidBids,
          totalEarnings: earningsTotal,
          totalCommission: commissionTotal,
          commissionPercent: settings.platformCommissionPercent
        },
        recent: {
          users: recentUsers,
          projects: recentProjects,
          payments: recentPayments,
          activityLogs: recentActivityLogs
        },
        charts: {
          revenue: revenueSeries,
          growth: growthSeries
        },
        top: {
          freelancers: topFreelancers,
          clients: topClients
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    if (req.query.role) {
      if (req.query.role === 'freelancer') {
        filters.role = { $in: ['freelancer', 'both'] };
      } else if (req.query.role === 'client') {
        filters.role = { $in: ['client', 'both'] };
      } else if (req.query.role === 'freelancer_only') {
        filters.role = 'freelancer';
      } else if (req.query.role === 'client_only') {
        filters.role = 'client';
      } else {
        filters.role = req.query.role;
      }
    }

    if (req.query.status === 'banned') {
      filters.isBanned = true;
    } else if (req.query.status === 'active') {
      filters.isBanned = { $ne: true };
    }

    if (req.query.approvalStatus) {
      filters.freelancerApprovalStatus = req.query.approvalStatus;
    }

    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('-password -emailVerificationCode -emailVerificationExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [user, logs, gigs, bids, ratings, disputes] = await Promise.all([
      User.findById(id).select('-password').lean(),
      AdminActivityLog.find({ $or: [{ actorId: id }, { entityId: id }] }).sort({ createdAt: -1 }).limit(20).lean(),
      Gig.find({ ownerId: id }).sort({ createdAt: -1 }).limit(10).lean(),
      Bid.find({ freelancerId: id }).sort({ createdAt: -1 }).limit(10).lean(),
      Rating.find({ $or: [{ freelancerId: id }, { clientId: id }] }).sort({ createdAt: -1 }).limit(10).lean(),
      Dispute.find({ $or: [{ raisedBy: id }, { againstUser: id }] }).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user,
      activity: { logs, gigs, bids, ratings, disputes }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveFreelancer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.freelancerApprovalStatus = 'approved';
    await user.save();

    await recordActivity(req, {
      action: 'approve_freelancer',
      entityType: 'User',
      entityId: user._id,
      description: `Approved freelancer profile for ${user.email}`
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.rejectFreelancer = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.freelancerApprovalStatus = 'rejected';
    if (reason) user.banReason = String(reason).slice(0, 500);
    await user.save();

    await recordActivity(req, {
      action: 'reject_freelancer',
      entityType: 'User',
      entityId: user._id,
      description: `Rejected freelancer profile for ${user.email}`,
      metadata: { reason: reason || null }
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = true;
    user.accountStatus = 'suspended';
    user.banReason = reason || 'Policy violation';
    user.bannedAt = new Date();
    user.bannedBy = req.user._id;
    await user.save();

    await recordActivity(req, {
      action: 'ban_user',
      entityType: 'User',
      entityId: user._id,
      description: `Banned user ${user.email}`,
      metadata: { reason: user.banReason }
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = false;
    user.accountStatus = 'active';
    user.banReason = null;
    user.bannedAt = null;
    user.bannedBy = null;
    await user.save();

    await recordActivity(req, {
      action: 'unban_user',
      entityType: 'User',
      entityId: user._id,
      description: `Unbanned user ${user.email}`
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Privileged users cannot be deleted from this action' });
    }

    const [ownedGigs, freelancerBids, conversations] = await Promise.all([
      Gig.find({ ownerId: id }).select('_id').lean(),
      Bid.find({ freelancerId: id }).select('_id').lean(),
      Conversation.find({ $or: [{ clientId: id }, { freelancerId: id }] }).select('_id').lean()
    ]);

    const gigIds = ownedGigs.map((gig) => gig._id);
    const bidIds = freelancerBids.map((bid) => bid._id);
    const conversationIds = conversations.map((conversation) => conversation._id);

    await Promise.all([
      Rating.deleteMany({
        $or: [
          { freelancerId: id },
          { clientId: id },
          gigIds.length ? { gigId: { $in: gigIds } } : null,
          bidIds.length ? { bidId: { $in: bidIds } } : null
        ].filter(Boolean)
      }),
      Message.deleteMany({
        $or: [
          { senderId: id },
          { receiverId: id },
          conversationIds.length ? { conversationId: { $in: conversationIds } } : null
        ].filter(Boolean)
      }),
      Conversation.deleteMany({
        $or: [
          { clientId: id },
          { freelancerId: id }
        ]
      }),
      Bid.deleteMany({
        $or: [
          { freelancerId: id },
          gigIds.length ? { gigId: { $in: gigIds } } : null
        ].filter(Boolean)
      }),
      Gig.deleteMany({ ownerId: id }),
      Dispute.deleteMany({ $or: [{ raisedBy: id }, { againstUser: id }] }),
      WithdrawalRequest.deleteMany({ freelancerId: id }),
      Announcement.deleteMany({ createdBy: id }),
      User.deleteOne({ _id: id })
    ]);

    await recordActivity(req, {
      action: 'delete_user',
      entityType: 'User',
      entityId: id,
      description: `Deleted user ${user.email}`,
      metadata: {
        deletedRole: user.role,
        removedOwnedGigs: gigIds.length,
        removedFreelancerBids: bidIds.length,
        removedConversations: conversationIds.length
      }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.moderationStatus) filters.moderationStatus = req.query.moderationStatus;
    if (req.query.search) {
      filters.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [projects, total] = await Promise.all([
      Gig.find(filters)
        .populate('ownerId', 'name email profilePhoto role')
        .populate('hiredBidId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gig.countDocuments(filters)
    ]);

    res.json({ success: true, page, limit, total, projects });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Gig.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const updates = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.description) updates.description = req.body.description;
    if (req.body.budget) updates.budget = Number(req.body.budget);
    if (req.body.status) updates.status = req.body.status;
    if (req.body.moderationStatus) updates.moderationStatus = req.body.moderationStatus;
    if (req.body.moderationNote !== undefined) updates.moderationNote = req.body.moderationNote;

    updates.moderatedBy = req.user._id;
    updates.moderatedAt = new Date();

    const updated = await Gig.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('ownerId', 'name email profilePhoto role');

    await recordActivity(req, {
      action: 'update_project',
      entityType: 'Gig',
      entityId: updated._id,
      description: `Updated project ${updated.title}`,
      metadata: updates
    });

    res.json({ success: true, project: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Gig.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const bids = await Bid.find({ gigId: project._id }).select('_id');
    const bidIds = bids.map((bid) => bid._id);
    const conversation = await Conversation.findOne({ gigId: project._id }).select('_id');

    await Promise.all([
      Rating.deleteMany({ gigId: project._id }),
      Message.deleteMany(conversation ? { conversationId: conversation._id } : { gigId: project._id }),
      Conversation.deleteMany({ gigId: project._id }),
      Bid.deleteMany({ gigId: project._id }),
      Gig.deleteOne({ _id: project._id })
    ]);

    await recordActivity(req, {
      action: 'delete_project',
      entityType: 'Gig',
      entityId: project._id,
      description: `Deleted project ${project.title}`,
      metadata: { bidCount: bidIds.length }
    });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

exports.createGigAsClient = async (req, res, next) => {
  try {
    const { clientEmail, clientId, title, description, budget } = req.body;

    if ((!clientEmail && !clientId) || !title || !description || !budget) {
      return res.status(400).json({ success: false, message: 'clientEmail, title, description and budget are required' });
    }

    let client = null;
    let resolvedClientId = null;

    if (clientEmail) {
      const normalizedEmail = String(clientEmail).trim().toLowerCase();
      client = await User.findOne({ email: normalizedEmail }).select('name email role').lean();
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client not found for this email' });
      }
      resolvedClientId = client._id;
    } else {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ success: false, message: 'Invalid clientId' });
      }
      client = await User.findById(clientId).select('name email role').lean();
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      resolvedClientId = client._id;
    }

    if (!['client', 'both'].includes(client.role)) {
      return res.status(400).json({ success: false, message: 'Provided user is not a client' });
    }

    const createdGig = await Gig.create({
      title: String(title).trim(),
      description: String(description).trim(),
      budget: Number(budget),
      ownerId: resolvedClientId,
      status: 'open',
      moderationStatus: 'approved',
      moderatedBy: req.user._id,
      moderatedAt: new Date()
    });

    await recordActivity(req, {
      action: 'create_gig_as_client',
      entityType: 'Gig',
      entityId: createdGig._id,
      description: `Created gig ${createdGig.title} for client ${client.email}`,
      metadata: {
        clientId: resolvedClientId,
        clientEmail: client.email
      }
    });

    res.status(201).json({ success: true, gig: createdGig });
  } catch (error) {
    next(error);
  }
};

exports.getBids = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.search) {
      filters.$or = [
        { message: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [bids, total] = await Promise.all([
      Bid.find(filters)
        .populate('gigId', 'title status moderationStatus ownerId')
        .populate('freelancerId', 'name email profilePhoto ratingAvg ratingCount freelancerApprovalStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bid.countDocuments(filters)
    ]);

    const enriched = await Promise.all(bids.map(async (bid) => {
      const spam = await detectSpamScore(bid);
      return { ...bid, spam };
    }));

    res.json({ success: true, page, limit, total, bids: enriched });
  } catch (error) {
    next(error);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};
    if (req.query.status === 'paid') {
      filters['payment.paid'] = true;
    }
    if (req.query.escrowStatus) {
      filters['payment.escrowStatus'] = req.query.escrowStatus;
    }

    const [transactions, total] = await Promise.all([
      Bid.find(filters)
        .populate('gigId', 'title ownerId')
        .populate('gigId.ownerId', 'name email')
        .populate('freelancerId', 'name email profilePhoto')
        .sort({ 'payment.verifiedAt': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bid.countDocuments(filters)
    ]);

    const ownerIdsToResolve = [];
    transactions.forEach((bid) => {
      const ownerRef = bid?.gigId?.ownerId;
      if (!ownerRef) return;
      const hasName = typeof ownerRef === 'object' && ownerRef.name;
      if (!hasName && mongoose.Types.ObjectId.isValid(String(ownerRef))) {
        ownerIdsToResolve.push(String(ownerRef));
      }
    });

    const ownerLookup = new Map();
    if (ownerIdsToResolve.length) {
      const owners = await User.find({ _id: { $in: [...new Set(ownerIdsToResolve)] } })
        .select('name email')
        .lean();
      owners.forEach((owner) => ownerLookup.set(String(owner._id), owner));
    }

    const mapped = transactions.map((bid) => {
      const ownerRef = bid?.gigId?.ownerId;
      const populatedOwner = ownerRef && typeof ownerRef === 'object' && ownerRef.name ? ownerRef : null;
      const resolvedOwner = populatedOwner || (ownerRef ? ownerLookup.get(String(ownerRef)) : null) || null;

      return {
        id: bid._id,
        bidId: bid._id,
        gig: bid.gigId,
        client: resolvedOwner,
        freelancer: bid.freelancerId,
        amount: bid.payment?.amount || bid.price,
        currency: bid.payment?.currency || 'INR',
        paymentId: bid.payment?.paymentId || null,
        orderId: bid.payment?.orderId || null,
        paid: Boolean(bid.payment?.paid),
        escrowStatus: bid.payment?.escrowStatus || 'none',
        escrowUpdatedAt: bid.payment?.escrowUpdatedAt || null,
        verifiedAt: bid.payment?.verifiedAt || null,
        createdAt: bid.createdAt
      };
    });

    res.json({ success: true, page, limit, total, transactions: mapped });
  } catch (error) {
    next(error);
  }
};

exports.updateEscrow = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['held', 'released', 'refunded'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid escrow status' });
    }

    const bid = await Bid.findById(req.params.id).populate('gigId');
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    bid.payment.escrowStatus = status;
    bid.payment.escrowUpdatedAt = new Date();
    bid.payment.escrowNote = note || null;
    await bid.save();

    await recordActivity(req, {
      action: 'update_escrow',
      entityType: 'Bid',
      entityId: bid._id,
      description: `Escrow marked as ${status} for bid ${bid._id}`,
      metadata: { note: note || null }
    });

    res.json({ success: true, bid });
  } catch (error) {
    next(error);
  }
};

exports.getWithdrawals = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const [requests, total] = await Promise.all([
      WithdrawalRequest.find(filters)
        .populate('freelancerId', 'name email profilePhoto ratingAvg ratingCount')
        .populate('processedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WithdrawalRequest.countDocuments(filters)
    ]);

    res.json({ success: true, page, limit, total, withdrawals: requests });
  } catch (error) {
    next(error);
  }
};

exports.updateWithdrawal = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (status) request.status = status;
    if (note !== undefined) request.note = note;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    await request.save();

    await recordActivity(req, {
      action: 'update_withdrawal',
      entityType: 'WithdrawalRequest',
      entityId: request._id,
      description: `Withdrawal request ${request.status}`,
      metadata: { status: request.status }
    });

    res.json({ success: true, withdrawal: request });
  } catch (error) {
    next(error);
  }
};

exports.getDisputes = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filters)
        .populate('bidId', 'message price status payment')
        .populate('gigId', 'title status moderationStatus')
        .populate('raisedBy', 'name email profilePhoto role')
        .populate('againstUser', 'name email profilePhoto role')
        .populate('resolvedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Dispute.countDocuments(filters)
    ]);

    res.json({ success: true, page, limit, total, disputes });
  } catch (error) {
    next(error);
  }
};

exports.resolveDispute = async (req, res, next) => {
  try {
    const { status, resolutionType, resolutionNote } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    if (status) dispute.status = status;
    if (resolutionType) dispute.resolutionType = resolutionType;
    if (resolutionNote !== undefined) dispute.resolutionNote = resolutionNote;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    await recordActivity(req, {
      action: 'resolve_dispute',
      entityType: 'Dispute',
      entityId: dispute._id,
      description: `Resolved dispute ${dispute._id}`,
      metadata: { status: dispute.status, resolutionType: dispute.resolutionType }
    });

    res.json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};
    if (req.query.search) {
      filters.comment = { $regex: req.query.search, $options: 'i' };
    }

    const [reviews, total] = await Promise.all([
      Rating.find(filters)
        .populate('freelancerId', 'name email profilePhoto ratingAvg ratingCount')
        .populate('clientId', 'name email profilePhoto')
        .populate('gigId', 'title status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rating.countDocuments(filters)
    ]);

    res.json({ success: true, page, limit, total, reviews });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Rating.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await Rating.deleteOne({ _id: review._id });
    await recordActivity(req, {
      action: 'delete_review',
      entityType: 'Rating',
      entityId: review._id,
      description: `Deleted review ${review._id}`,
      metadata: { stars: review.stars }
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

exports.sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, audience = 'all', sendEmail: shouldEmail = false } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      audience,
      sendEmail: Boolean(shouldEmail),
      createdBy: req.user._id
    });

    if (shouldEmail) {
      const userFilters = {};
      if (audience === 'clients') userFilters.role = { $in: ['client', 'both'] };
      if (audience === 'freelancers') userFilters.role = { $in: ['freelancer', 'both'] };
      if (audience === 'admins') userFilters.role = { $in: ['admin', 'moderator'] };

      const recipients = await User.find(userFilters).select('email').lean();
      await Promise.all(recipients.map((recipient) => sendEmail({
        to: recipient.email,
        subject: title,
        text: message,
        html: `<p>${message}</p>`
      })));
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('admin_announcement', { title, message, audience });
    }

    await recordActivity(req, {
      action: 'send_announcement',
      entityType: 'Announcement',
      entityId: announcement._id,
      description: `Sent announcement to ${audience}`,
      metadata: { sendEmail: Boolean(shouldEmail) }
    });

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const settings = await getSettings();
    const earningsSeries = await getMonthlySeries(Bid, { 'payment.paid': true }, 'createdAt', 'payment.amount', 12);
    const growthSeries = await getMonthlySeries(User, {}, 'createdAt', null, 12);

    const topFreelancers = await User.aggregate([
      { $match: { role: { $in: ['freelancer', 'both'] } } },
      {
        $lookup: {
          from: 'bids',
          localField: '_id',
          foreignField: 'freelancerId',
          as: 'bids'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          profilePhoto: 1,
          ratingAvg: 1,
          ratingCount: 1,
          paidBids: {
            $size: {
              $filter: { input: '$bids', as: 'bid', cond: { $eq: ['$$bid.payment.paid', true] } }
            }
          }
        }
      },
      { $sort: { ratingAvg: -1, paidBids: -1 } },
      { $limit: 10 }
    ]);

    const topClients = await User.aggregate([
      { $match: { role: { $in: ['client', 'both'] } } },
      {
        $lookup: {
          from: 'gigs',
          localField: '_id',
          foreignField: 'ownerId',
          as: 'gigs'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          profilePhoto: 1,
          gigsCreated: { $size: '$gigs' }
        }
      },
      { $sort: { gigsCreated: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      reports: {
        commissionPercent: settings.platformCommissionPercent,
        earningsSeries,
        growthSeries,
        topFreelancers,
        topClients
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSetting.findOneAndUpdate({}, { $set: req.body }, { upsert: true, new: true, setDefaultsOnInsert: true });

    await recordActivity(req, {
      action: 'update_settings',
      entityType: 'PlatformSetting',
      entityId: settings._id,
      description: 'Updated platform settings'
    });

    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const admin = await User.findById(req.user._id).select('+password');
    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is invalid' });
    }

    admin.password = newPassword;
    await admin.save();

    await recordActivity(req, {
      action: 'change_admin_password',
      entityType: 'User',
      entityId: admin._id,
      description: 'Updated admin credentials'
    });

    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};

exports.createAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const normalizedRole = String(role).trim().toLowerCase();
    if (!['admin', 'moderator'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or moderator' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const created = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      isEmailVerified: true,
      freelancerApprovalStatus: 'approved',
      accountStatus: 'active',
      isBanned: false
    });

    await recordActivity(req, {
      action: 'create_admin_user',
      entityType: 'User',
      entityId: created._id,
      description: `Created ${normalizedRole} user ${normalizedEmail}`,
      metadata: { role: normalizedRole }
    });

    res.status(201).json({
      success: true,
      user: {
        id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
        accountStatus: created.accountStatus,
        isEmailVerified: created.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'client' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const normalizedRole = String(role).trim().toLowerCase();
    if (!['client', 'freelancer', 'both'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Role must be client, freelancer, or both' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const created = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      isEmailVerified: true,
      freelancerApprovalStatus: 'approved',
      accountStatus: 'active',
      isBanned: false
    });

    await recordActivity(req, {
      action: 'create_user',
      entityType: 'User',
      entityId: created._id,
      description: `Created ${normalizedRole} user ${normalizedEmail}`,
      metadata: { role: normalizedRole }
    });

    res.status(201).json({
      success: true,
      user: {
        id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
        accountStatus: created.accountStatus,
        isEmailVerified: created.isEmailVerified,
        freelancerApprovalStatus: created.freelancerApprovalStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (!name && !email) {
      return res.status(400).json({ success: false, message: 'At least name or email is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (name) updates.name = String(name).trim();
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      updates.email = normalizedEmail;
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    await recordActivity(req, {
      action: 'update_user_profile',
      entityType: 'User',
      entityId: updated._id,
      description: `Updated user profile for ${updated.email}`,
      metadata: updates
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (!newRole) {
      return res.status(400).json({ success: false, message: 'New role is required' });
    }

    const normalizedRole = String(newRole).trim().toLowerCase();
    if (!['client', 'freelancer', 'both'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Role must be client, freelancer, or both' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Admin role conversion is not allowed here' });
    }

    if (user.role === normalizedRole) {
      return res.status(400).json({ success: false, message: 'User already has this role' });
    }

    // Don't allow changing your own role
    if (req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const oldRole = user.role;
    user.role = normalizedRole;
    user.freelancerApprovalStatus = 'approved';
    
    await user.save();

    await recordActivity(req, {
      action: 'change_user_role',
      entityType: 'User',
      entityId: user._id,
      description: `Changed user role from ${oldRole} to ${normalizedRole} for ${user.email}`,
      metadata: { oldRole, newRole: normalizedRole }
    });

    res.json({ success: true, user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
  } catch (error) {
    next(error);
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const filters = {};
    if (req.query.action) filters.action = req.query.action;
    if (req.query.entityType) filters.entityType = req.query.entityType;

    const [logs, total] = await Promise.all([
      AdminActivityLog.find(filters)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminActivityLog.countDocuments(filters)
    ]);

    res.json({ success: true, page, limit, total, logs });
  } catch (error) {
    next(error);
  }
};
