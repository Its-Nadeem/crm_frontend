import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const restoreAdminUser = async () => {
    try {
        console.log('🔧 Restoring super admin user and organizations...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // First, let's clear the test data that was inserted by mistake
        console.log('🗑️ Clearing test data...');
        await User.deleteMany({ email: { $in: ['test@example.com', 'admin@demo.com'] } });
        console.log('✅ Cleared test users');

        // Create the super admin user
        console.log('👤 Creating super admin user...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Nadeem@0331', salt);

        const superAdminUser = new User({
            id: 1,
            name: 'Nadeem Jabir',
            email: 'Nadeemjabir1@gmail.com', // Fixed the typo
            password: hashedPassword,
            role: 'Super Admin',
            organizationId: 'org-1',
            superAdminRole: 'Co-Owner',
            permissions: ['all']
        });

        const savedUser = await superAdminUser.save();
        console.log(`✅ Super admin user created: ${savedUser.name} (${savedUser.email})`);

        // Check if org-1 exists, if not create it
        console.log('🏢 Checking organizations...');
        let org1 = await Organization.findOne({ id: 'org-1' });

        if (!org1) {
            console.log('📝 Creating org-1...');
            org1 = new Organization({
                id: 'org-1',
                name: 'Organization 1',
                code: 'ORG1',
                apiKey: 'org1_api_key_' + Date.now(),
                isEnabled: true,
                subscriptionPlanId: 'enterprise',
                subscriptionExpiresAt: new Date('2025-12-31')
            });
            await org1.save();
            console.log('✅ Created org-1');
        } else {
            console.log('✅ org-1 already exists');
        }

        // Check if org-2 exists, if not create it
        let org2 = await Organization.findOne({ id: 'org-2' });

        if (!org2) {
            console.log('📝 Creating org-2...');
            org2 = new Organization({
                id: 'org-2',
                name: 'Organization 2',
                code: 'ORG2',
                apiKey: 'org2_api_key_' + Date.now(),
                isEnabled: true,
                subscriptionPlanId: 'enterprise',
                subscriptionExpiresAt: new Date('2025-12-31')
            });
            await org2.save();
            console.log('✅ Created org-2');
        } else {
            console.log('✅ org-2 already exists');
        }

        // Verify the restoration
        console.log('\n🔍 Verifying restoration...');
        const users = await User.find({});
        const organizations = await Organization.find({});

        console.log(`👥 Total users: ${users.length}`);
        console.log(`🏢 Total organizations: ${organizations.length}`);

        // Show the restored user
        const restoredUser = users.find(u => u.email === 'Nadeemjabir1@gmail.com');
        if (restoredUser) {
            console.log(`✅ Super admin user verified: ${restoredUser.name} (${restoredUser.email})`);
            console.log(`   Role: ${restoredUser.role}`);
            console.log(`   Organization: ${restoredUser.organizationId}`);
            console.log(`   Super Admin Role: ${restoredUser.superAdminRole}`);
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        console.log('\n🎉 Restoration completed successfully!');
        console.log('You can now login with:');
        console.log('Email: Nadeemjabir1@gmail.com');
        console.log('Password: Nadeem@0331');

    } catch (error) {
        console.error('❌ Error during restoration:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

restoreAdminUser();


