const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,      // localhost dev
    sameSite: 'lax',    // ⭐ FIX
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

module.exports = { generateToken, setTokenCookie };
