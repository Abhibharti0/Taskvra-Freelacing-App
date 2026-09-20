const dns = require('dns');
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;

if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
  const dnsServers = (process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length > 0) {
    try {
      dns.setServers(dnsServers);
    } catch (error) {
      console.warn('Could not override DNS servers for MongoDB SRV lookup:', error.message);
    }
  }
}

const connectDB = async () => {
  try {
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined');
    }

    const conn = await mongoose.connect(mongoUri, {
      // Options for better connection handling
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(` MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error(' MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;