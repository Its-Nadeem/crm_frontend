// backend/config/db.js
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    // Already connected? Skip
    if (mongoose.connection.readyState >= 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    if (!MONGO_URI) {
      console.error('❌ MONGO_URI / MONGODB_URI is not defined.');
      return; // Vercel par process crash mat karo
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📊 MongoDB URI length:', MONGO_URI.length);

    await mongoose.connect(MONGO_URI);

    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);

    // Local dev: crash ok
    if (!process.env.VERCEL) {
      process.exit(1);
    }

    // Vercel: process ko mat marna, sirf error throw karo
    throw err;
  }
};
