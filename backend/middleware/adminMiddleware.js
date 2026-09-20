const User = require('../models/user');

const requireRoles = (...roles) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const latestUser = await User.findById(req.user._id).select('-password');
    if (!latestUser) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (latestUser.isBanned || latestUser.accountStatus === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    req.user = latestUser;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = requireRoles('admin');
const requireAdminOrModerator = requireRoles('admin', 'moderator');

module.exports = {
  requireRoles,
  requireAdmin,
  requireAdminOrModerator
};