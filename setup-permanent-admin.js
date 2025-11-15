import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setupPermanentAdmin = async () => {
    try {
        console.log('🔧 Setting up permanent SUPER ADMIN and organization admins...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Ensure SUPER ADMIN exists and is protected
        const superAdminEmail = 'nadeemjabir1@gmail.com';
        const superAdminPassword = 'Nadeem@0331';

        let superAdmin = await User.findOne({ email: superAdminEmail });

        if (!superAdmin) {
            // Create SUPER ADMIN
            superAdmin = await User.create({
                id: 1,
                name: 'Nadeem Jabir (Permanent Owner)',
                email: superAdminEmail,
                password: superAdminPassword,
                role: 'Super Admin',
                organizationId: 'org-1',
                superAdminRole: 'Co-Owner',
                permissions: ['all'],
                isTrackingEnabled: true,
                // Add permanent protection flag
                isPermanentOwner: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Created permanent SUPER ADMIN:', superAdmin.name);
        } else {
            // Update existing SUPER ADMIN to ensure permanent protection
            superAdmin.role = 'Super Admin';
            superAdmin.superAdminRole = 'Co-Owner';
            superAdmin.permissions = ['all'];
            superAdmin.isPermanentOwner = true;
            superAdmin.name = 'Nadeem Jabir (Permanent Owner)';
            await superAdmin.save();
            console.log('✅ Updated existing SUPER ADMIN with permanent protection');
        }

        // 2. Create organization admin users (safe to run multiple times)
        const orgAdmins = [
            {
                id: 2,
                name: 'Org1 Admin',
                email: 'admin@org1.com',
                password: 'Admin@123',
                role: 'Admin',
                organizationId: 'org-1',
                permissions: ['view:all_leads', 'manage:users', 'manage:settings']
            },
            {
                id: 3,
                name: 'Org2 Admin',
                email: 'admin@org2.com',
                password: 'Admin@123',
                role: 'Admin',
                organizationId: 'org-2',
                permissions: ['view:all_leads', 'manage:users', 'manage:settings']
            }
        ];

        for (const adminData of orgAdmins) {
            const existingAdmin = await User.findOne({ email: adminData.email });

            if (!existingAdmin) {
                // Create new admin
                const newAdmin = await User.create({
                    ...adminData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`✅ Created ${adminData.organizationId} admin:`, newAdmin.name);
            } else {
                // Update existing admin to ensure correct role and permissions
                existingAdmin.role = adminData.role;
                existingAdmin.organizationId = adminData.organizationId;
                existingAdmin.permissions = adminData.permissions;
                await existingAdmin.save();
                console.log(`✅ Updated existing ${adminData.organizationId} admin:`, existingAdmin.name);
            }
        }

        // 3. Display final user summary
        const allUsers = await User.find({}).select('name email role organizationId isPermanentOwner');
        console.log('\n📋 Final User Summary:');
        allUsers.forEach((user, i) => {
            const permanentFlag = user.isPermanentOwner ? ' [PERMANENT]' : '';
            const orgName = user.organizationId === 'org-1' ? 'Ed-Tech Global' :
                           user.organizationId === 'org-2' ? 'Realty Kings' :
                           user.organizationId || 'No Organization';
            console.log(`${i+1}. ${user.name} (${user.email}) - ${user.role} - ${orgName}${permanentFlag}`);
        });

        console.log('\n🔑 Login Credentials:');
        console.log(`   SUPER ADMIN: ${superAdminEmail} / ${superAdminPassword} [PERMANENT]`);
        console.log('   ORG-1 ADMIN: admin@org1.com / Admin@123');
        console.log('   ORG-2 ADMIN: admin@org2.com / Admin@123');

        console.log('\n✅ Setup completed successfully!');
        console.log('🎯 SUPER ADMIN is now permanently protected and cannot be deleted or demoted.');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during setup:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupPermanentAdmin();
}

export { setupPermanentAdmin };


