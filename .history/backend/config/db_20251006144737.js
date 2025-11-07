import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Production MongoDB connection with retry logic
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

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



