const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, getCookieOptions());
};

const clearTokenCookie = (res) => {
  const options = getCookieOptions();
  res.clearCookie('token', {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path
  });
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, getCookieOptions };
