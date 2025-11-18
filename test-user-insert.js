import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const testUserInsert = async () => {
    try {
        console.log('🔧 Testing user insertion...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing org admin users only
        await User.deleteMany({
            email: { $in: ['admin@org1.com', 'admin@org2.com'] }
        });
        console.log('🗑️ Cleared existing org admin users');

        // Create org-1 admin
        const org1Admin = {
            id: 2,
            name: 'Org1 Admin',
            email: 'admin@org1.com',
            password: 'Admin@123',
            role: 'Admin',
            organizationId: 'org-1',
            permissions: ['view:all_leads', 'manage:users', 'manage:settings']
        };

        // Create org-2 admin
        const org2Admin = {
            id: 3,
            name: 'Org2 Admin',
            email: 'admin@org2.com',
            password: 'Admin@123',
            role: 'Admin',
            organizationId: 'org-2',
            permissions: ['view:all_leads', 'manage:users', 'manage:settings']
        };

        console.log('👤 Creating organization admin users...');
        const createdOrg1Admin = await User.create(org1Admin);
        const createdOrg2Admin = await User.create(org2Admin);
        console.log('✅ Org1 Admin created:', createdOrg1Admin.name);
        console.log('✅ Org2 Admin created:', createdOrg2Admin.name);

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


