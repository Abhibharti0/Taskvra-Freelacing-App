const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

const parseCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, pair) => {
    const index = pair.indexOf('=');
    if (index === -1) return acc;

    const key = pair.slice(0, index).trim();
    const value = decodeURIComponent(pair.slice(index + 1).trim());
    acc[key] = value;
    return acc;
  }, {});
};

const normalizeOrigin = (origin) => origin.replace(/\/$/, '');

const setupSocket = (server) => {

  const onlineUsers = new Map();

  const allowedOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS || '').split(',')
  ]
    .filter(Boolean)
    .map((origin) => normalizeOrigin(origin.trim()));

  if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
  }

  const io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
        return callback(new Error('Not allowed by Socket.IO CORS'));
      },
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie || '');
      const token = cookies.token;

      if (!token) {
        return next(new Error('Unauthorized: missing token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // JOIN USER ROOM + ONLINE TRACK
    socket.on('join', () => {
      const userId = socket.data.userId;
      if (!userId) return;

      onlineUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // JOIN CONVERSATION
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // TYPING
    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(`conversation_${conversationId}`).emit('typing', { userId });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('stop_typing');
    });

    socket.on('disconnect', () => {
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;
