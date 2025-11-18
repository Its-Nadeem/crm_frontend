import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkAllUsers = async () => {
    try {
        console.log('🔍 Checking all users in MongoDB...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({}).select('name email role organizationId isPermanentOwner superAdminRole');

        console.log(`\n👥 Found ${users.length} users:`);

        if (users.length === 0) {
            console.log('❌ No users found in database');
        } else {
            users.forEach((user, i) => {
                console.log(`${i+1}. Name: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Organization ID: ${user.organizationId || 'None'}`);
                console.log(`   Super Admin Role: ${user.superAdminRole || 'None'}`);
                console.log(`   Is Permanent Owner: ${user.isPermanentOwner ? 'YES' : 'NO'}`);
                console.log('   ---');
            });
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkAllUsers();


