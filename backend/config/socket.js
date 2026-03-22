const socketIO = require('socket.io');

const setupSocket = (server) => {

  const onlineUsers = new Map();

  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174'
  ];

  const io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by Socket.IO CORS'));
      },
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // JOIN USER ROOM + ONLINE TRACK
    socket.on('join', (userId) => {
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
