import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const deleteTestUser = async () => {
    try {
        console.log('🗑️  Deleting test@example.com user...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // First check if the user exists
        const testUser = await User.findOne({ email: 'test@example.com' });

        if (!testUser) {
            console.log('❌ User test@example.com not found');
            await mongoose.disconnect();
            return;
        }

        console.log(`👤 Found user: ${testUser.name} (${testUser.email})`);
        console.log(`   Role: ${testUser.role}`);
        console.log(`   ID: ${testUser.id}`);

        // Delete the user
        const deletedUser = await User.findOneAndDelete({ email: 'test@example.com' });

        if (deletedUser) {
            console.log('✅ Successfully deleted test@example.com user');
            console.log(`🗑️  Deleted user: ${deletedUser.name} (${deletedUser.email})`);
        } else {
            console.log('❌ Failed to delete user');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

deleteTestUser();


