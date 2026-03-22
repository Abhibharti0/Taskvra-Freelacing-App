import { io } from 'socket.io-client';

// Get Socket URL from environment or use localhost
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) {
    return envUrl;
  }
  // Default to backend server (not frontend)
  const isProduction = import.meta.env.PROD;
  return isProduction ? window.location.origin : 'http://localhost:5000';
};

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (!this.socket) {
      const socketUrl = getSocketUrl();
      this.socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'] 
      });

      this.socket.on('connect', () => {
        console.log(' Socket connected');
        // Join user-specific room
        this.socket.emit('join', userId);
      });

      this.socket.on('disconnect', () => {
        console.log(' Socket disconnected');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
