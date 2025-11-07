import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI;

    console.log('Environment variables check:');
    console.log('MONGODB_URI exists:', !!mongoUri);
    console.log('MONGODB_URI length:', mongoUri ? mongoUri.length : 0);

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI (first 50 chars):', mongoUri.substring(0, 50) + '...');

    // Simple MongoDB connection
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;



