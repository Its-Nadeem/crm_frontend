import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const directConnectTest = async () => {
    try {
        console.log('🔍 Direct MongoDB connection test...');

        const mongoUri = process.env.MONGODB_URI;
        console.log('MongoDB URI exists:', !!mongoUri);

        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found');
            return;
        }

        console.log('MongoDB URI length:', mongoUri.length);
        console.log('MongoDB URI preview:', mongoUri.substring(0, 50) + '...');

        // Try to connect with very basic options
        console.log('🔄 Connecting...');
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log('✅ SUCCESS! MongoDB Connected');
        console.log('Database name:', conn.connection.db.databaseName);

        // Test a simple operation
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('📋 Collections found:', collections.length);

        // Test User model
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String
        }));

        const userCount = await User.countDocuments();
        console.log('👥 Users in database:', userCount);

        await mongoose.disconnect();
        console.log('🔌 Disconnected successfully');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Error codeName:', error.codeName);
        console.error('Stack:', error.stack);
    }
};

directConnectTest();


