const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  try {
    let token;

    // Cookie se token lo
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      Token payload structure:
      { userId: user._id }
      So we must read decoded.userId here.
    */
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;   // ✅ NOW req.user._id available everywhere

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

module.exports = protect;
