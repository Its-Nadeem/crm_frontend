import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createSuperAdmin = async () => {
    try {
        console.log('🔧 Creating SUPER ADMIN user...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const superAdminEmail = 'nadeemjabir1@gmail.com';
        const superAdminPassword = 'Nadeem@0331';

        // Check if SUPER ADMIN already exists
        const existingSuperAdmin = await User.findOne({ email: superAdminEmail });

        if (existingSuperAdmin) {
            console.log('✅ SUPER ADMIN already exists, updating...');
            existingSuperAdmin.role = 'Super Admin';
            existingSuperAdmin.superAdminRole = 'Co-Owner';
            existingSuperAdmin.permissions = ['all'];
            existingSuperAdmin.isPermanentOwner = true;
            existingSuperAdmin.name = 'Nadeem Jabir (Permanent Owner)';
            existingSuperAdmin.organizationId = 'org-1';
            existingSuperAdmin.isTrackingEnabled = true;

            await existingSuperAdmin.save();
            console.log('✅ SUPER ADMIN updated successfully');
        } else {
            // Create new SUPER ADMIN
            const superAdmin = await User.create({
                id: 1,
                name: 'Nadeem Jabir (Permanent Owner)',
                email: superAdminEmail,
                password: superAdminPassword,
                role: 'Super Admin',
                organizationId: 'org-1',
                superAdminRole: 'Co-Owner',
                permissions: ['all'],
                isTrackingEnabled: true,
                isPermanentOwner: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ SUPER ADMIN created successfully');
        }

        // Verify the SUPER ADMIN was created/updated correctly
        const verifySuperAdmin = await User.findOne({ email: superAdminEmail });
        console.log('\n🔍 Verification:');
        console.log(`   Name: ${verifySuperAdmin.name}`);
        console.log(`   Email: ${verifySuperAdmin.email}`);
        console.log(`   Role: ${verifySuperAdmin.role}`);
        console.log(`   Super Admin Role: ${verifySuperAdmin.superAdminRole}`);
        console.log(`   Organization ID: ${verifySuperAdmin.organizationId}`);
        console.log(`   Permissions: ${verifySuperAdmin.permissions?.join(', ')}`);
        console.log(`   Is Permanent Owner: ${verifySuperAdmin.isPermanentOwner ? 'YES' : 'NO'}`);
        console.log(`   Is Tracking Enabled: ${verifySuperAdmin.isTrackingEnabled ? 'YES' : 'NO'}`);

        console.log('\n🔑 Login Credentials:');
        console.log(`   SUPER ADMIN: ${superAdminEmail} / ${superAdminPassword}`);

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        console.log('\n🎉 SUPER ADMIN is now properly saved in MongoDB!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createSuperAdmin();


