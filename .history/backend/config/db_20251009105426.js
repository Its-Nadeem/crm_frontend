import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI length:', mongoUri.length);

    // Try connecting with minimal options
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);

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



