import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    // If already connected, skip new connection
    if (mongoose.connection.readyState >= 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    if (!MONGO_URI) {
      console.error('❌ MONGO_URI / MONGODB_URI is not defined.');
      return; // Do NOT crash on Vercel
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📊 MongoDB URI length:', MONGO_URI.length);

    await mongoose.connect(MONGO_URI);

    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);

    // In local dev, crash is OK
    if (!process.env.VERCEL) {
      process.exit(1);
    }

    // On Vercel, do NOT exit → just throw for handler to return JSON
    throw err;
  }
};
