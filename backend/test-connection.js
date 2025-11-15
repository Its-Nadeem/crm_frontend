import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('🔍 Testing MongoDB connection...');

        const mongoUri = process.env.MONGODB_URI;
        console.log('MongoDB URI exists:', !!mongoUri);

        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found');
            return;
        }

        console.log('MongoDB URI length:', mongoUri.length);
        console.log('MongoDB URI preview:', mongoUri.substring(0, 60) + '...');

        // Try to connect
        const conn = await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected Successfully!');
        console.log('Database:', conn.connection.db.databaseName);

        // Test a simple operation
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('📋 Collections found:', collections.length);

        await mongoose.disconnect();
        console.log('🔌 Disconnected successfully');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error details:', error);
    }
};

testConnection();


