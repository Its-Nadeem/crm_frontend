import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

        await mongoose.connect(process.env.MONGODB_URI, {
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });

        console.log('✅ Connected successfully to MongoDB');

        // Test database operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections`);

        // Test user count
        const User = mongoose.model('User', new mongoose.Schema({ name: String }));
        const userCount = await User.countDocuments();
        console.log(`👥 Users in database: ${userCount}`);

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
};

testConnection();


