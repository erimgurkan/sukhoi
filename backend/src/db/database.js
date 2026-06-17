const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config');

// We will use MONGODB_URI from config, or fallback to local Memory Server / Localhost
const MONGODB_URI = config.mongodb.uri;

mongoose.connection.on('connected', () => {
  logger.info('Successfully connected to MongoDB.');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
  mongoose.connection.lastError = err.message;
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
});

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    logger.error('Failed to connect to MongoDB on startup', err);
    mongoose.connection.lastError = err.message;
    // Do not exit process, let the app run without DB and wait for user to provide URI
  }
};

connectDB();

module.exports = mongoose.connection;
