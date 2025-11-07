import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testUserInsert = async () => {
    try {
        console.log('🔧 Testing user insertion...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear users first
        await User.deleteMany({});
        console.log('🗑️ Cleared users');

        // Try to insert one simple user
        const testUser = {
            id: 999,
            name: 'Test User',
            email: 'test@example.com',
            password: 'test123',
            role: 'Admin',
            organizationId: 'test-org'
        };

        console.log('👤 Inserting test user:', testUser);
        const createdUser = await User.create(testUser);
        console.log('✅ Test user inserted:', createdUser.name);

        // Check count
        const count = await User.countDocuments();
        console.log('👥 Total users:', count);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

testUserInsert();


