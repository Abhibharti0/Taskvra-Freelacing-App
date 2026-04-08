const User = require('../models/user');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/generateToken');
const { sendEmail } = require('../utils/email');

// Helper to generate and send a 6-digit code
const issueVerificationCode = async (user) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.emailVerificationCode = code;
  user.emailVerificationExpires = expires;
  await user.save();

  const subject = 'Your Taskvra verification code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is <b>${code}</b>.</p><p>It expires in 10 minutes.</p>`;

  try {
    await sendEmail({ to: user.email, subject, text, html });
  } catch (e) {
    console.error('Failed to send email verification code:', e.message);
  }
};

/* ================= REGISTER ================= */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Build user data object
    const userData = { 
      name, 
      email, 
      password,
      role: role || 'client'
    };
    
    // Add optional fields if provided
    if (bio) userData.bio = String(bio).slice(0, 500);
    if (req.file) userData.profilePhoto = req.file.path || req.file.secure_url;

    const user = await User.create(userData);

    // Issue verification code and DO NOT log the user in yet
    await issueVerificationCode(user);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      userId: user._id,
      message: 'Verification code sent to your email'
    });
  } catch (err) {
    next(err);
  }
};

/* ================= LOGIN ================= */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If email not verified, send code and require verification step
    if (!user.isEmailVerified) {
      await issueVerificationCode(user);
      return res.json({
        success: true,
        requiresVerification: true,
        userId: user._id,
        message: 'Verification code sent to your email'
      });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ================= LOGOUT ================= */
const logout = (req, res) => {
  clearTokenCookie(res);

  res.json({ success: true });
};

/* ================= GET ME ================= */
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePhoto: req.user.profilePhoto,
      bio: req.user.bio,
      role: req.user.role,
      ratingAvg: req.user.ratingAvg || 0,
      ratingCount: req.user.ratingCount || 0
    }
  });
};

/* ================= UPDATE PROFILE ================= */
const updateProfile = async (req, res) => {
  try {
    const update = {};

    if (req.body.name) update.name = req.body.name;
    if (req.body.bio !== undefined) update.bio = String(req.body.bio).slice(0, 500);
    if (req.file) update.profilePhoto = req.file.path || req.file.secure_url;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed' });
  }
};

/* ================= EXPORTS ================= */
module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  verifyEmail: async (req, res, next) => {
    try {
      const { userId, code } = req.body;
      if (!userId || !code) return res.status(400).json({ message: 'Missing parameters' });

      const user = await User.findById(userId).select('+password');
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (user.isEmailVerified) {
        const token = generateToken(user._id);
        setTokenCookie(res, token);
        return res.json({
          success: true,
          user: { 
            id: user._id, 
            name: user.name, 
            email: user.email, 
            profilePhoto: user.profilePhoto,
            bio: user.bio,
            role: user.role
          }
        });
      }

      if (!user.emailVerificationCode || !user.emailVerificationExpires) {
        return res.status(400).json({ message: 'No verification code issued' });
      }
      if (new Date() > new Date(user.emailVerificationExpires)) {
        return res.status(400).json({ message: 'Verification code expired' });
      }
      if (String(code).trim() !== String(user.emailVerificationCode).trim()) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationExpires = null;
      await user.save();

      const token = generateToken(user._id);
      setTokenCookie(res, token);
      res.json({
        success: true,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          profilePhoto: user.profilePhoto,
          bio: user.bio,
          role: user.role
        }
      });
    } catch (err) {
      next(err);
    }
  },
  resendVerificationCode: async (req, res, next) => {
    try {
      const { userId, email } = req.body;
      let user = null;
      if (userId) user = await User.findById(userId);
      if (!user && email) user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

      await issueVerificationCode(user);
      res.json({ success: true, message: 'Verification code resent' });
    } catch (err) {
      next(err);
    }
  }
  ,
  getPublicUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('name email profilePhoto bio role ratingAvg ratingCount createdAt');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      // Get additional stats
      const Gig = require('../models/gig');
      const Bid = require('../models/bid');
      
      const [gigsCreated, bidsSubmitted] = await Promise.all([
        Gig.countDocuments({ clientId: id }),
        Bid.countDocuments({ freelancerId: id })
      ]);
      
      res.json({ 
        success: true, 
        user: {
          ...user.toObject(),
          gigsCreated,
          bidsSubmitted,
          rating: user.ratingAvg
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
