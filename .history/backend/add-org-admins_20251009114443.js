import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const addOrgAdmins = async () => {
    try {
        console.log('🔧 Adding admin users to organizations...');

        // Connect to MongoDB directly without using the config
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check current users
        const existingUsers = await User.find({});
        console.log(`📊 Current users in database: ${existingUsers.length}`);

        // Check current organizations
        const existingOrgs = await Organization.find({});
        console.log(`🏢 Current organizations in database: ${existingOrgs.length}`);

        // Add admin user to org-1
        const org1Admin = {
            id: 2,
            name: 'Org1 Admin',
            email: 'admin@org1.com',
            password: 'Admin@123', // Plain text - will be hashed by User model pre-save hook
            role: 'Admin',
            organizationId: 'org-1',
            superAdminRole: null
        };

        const org1AdminExists = await User.findOne({ email: 'admin@org1.com' });
        if (!org1AdminExists) {
            await User.create(org1Admin);
            console.log('✅ Added admin user to org-1: admin@org1.com');
        } else {
            console.log('ℹ️ Admin user for org-1 already exists');
        }

        // Add admin user to org-2
        const org2Admin = {
            id: 3,
            name: 'Org2 Admin',
            email: 'admin@org2.com',
            password: await bcrypt.hash('Admin@123', 10),
            role: 'Admin',
            organizationId: 'org-2',
            superAdminRole: null
        };

        const org2AdminExists = await User.findOne({ email: 'admin@org2.com' });
        if (!org2AdminExists) {
            await User.create(org2Admin);
            console.log('✅ Added admin user to org-2: admin@org2.com');
        } else {
            console.log('ℹ️ Admin user for org-2 already exists');
        }

        // Verify the additions
        const finalUsers = await User.find({});
        console.log(`\n👥 Final user count: ${finalUsers.length}`);
        finalUsers.forEach((user, i) => {
            console.log(`${i+1}. ${user.name} (${user.email}) - ${user.role} - Org: ${user.organizationId}`);
        });

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        console.log('\n🎉 Admin users added successfully!');

    } catch (error) {
        console.error('❌ Error adding admin users:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

addOrgAdmins();


