import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const addOrganizationUsers = async () => {
    try {
        console.log('🔧 Adding organization users to database...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if organizations exist
        const org1 = await Organization.findOne({ id: 'org-1' });
        const org2 = await Organization.findOne({ id: 'org-2' });

        if (!org1 || !org2) {
            console.log('❌ Organizations not found. Please run the seeder first.');
            return;
        }

        console.log('✅ Found existing organizations');

        // 1. Create/ensure super admin user exists
        const superAdminEmail = 'nadeemjabir1@gmail.com';
        const superAdminPassword = 'Nadeem@0331';

        let superAdmin = await User.findOne({ email: superAdminEmail });

        if (!superAdmin) {
            superAdmin = await User.create({
                id: 1,
                name: 'Nadeem Jabir',
                email: superAdminEmail,
                password: superAdminPassword,
                avatar: `https://i.pravatar.cc/150?u=1`,
                phone: '+1234567890',
                role: 'Super Admin',
                permissions: [],
                isTrackingEnabled: true,
                organizationId: '',
                superAdminRole: 'Co-Owner'
            });
            console.log('✅ Created super admin user:', superAdmin.name);
        } else {
            console.log('✅ Super admin user already exists:', superAdmin.name);
        }

        // 2. Create user for Ed-Tech Global (org-1)
        const edTechUserEmail = 'edtech.user@example.com';
        let edTechUser = await User.findOne({ email: edTechUserEmail });

        if (!edTechUser) {
            const nextUserId = Math.max(...(await User.find({}).select('id')).map(u => u.id)) + 1;

            edTechUser = await User.create({
                id: nextUserId,
                name: 'Ed-Tech Global User',
                email: edTechUserEmail,
                password: 'password123',
                avatar: `https://i.pravatar.cc/150?u=${nextUserId}`,
                phone: '+1234567891',
                role: 'Admin',
                teamId: 'team-edtech',
                permissions: ['view:all_leads', 'assign:leads', 'manage:users', 'manage:teams', 'manage:settings'],
                isTrackingEnabled: true,
                organizationId: 'org-1'
            });
            console.log('✅ Created Ed-Tech Global user:', edTechUser.name);
        } else {
            console.log('✅ Ed-Tech Global user already exists:', edTechUser.name);
        }

        // 3. Create user for Realty Kings (org-2)
        const realtyUserEmail = 'realty.user@example.com';
        let realtyUser = await User.findOne({ email: realtyUserEmail });

        if (!realtyUser) {
            const nextUserId2 = Math.max(...(await User.find({}).select('id')).map(u => u.id)) + 1;

            realtyUser = await User.create({
                id: nextUserId2,
                name: 'Realty Kings User',
                email: realtyUserEmail,
                password: 'password123',
                avatar: `https://i.pravatar.cc/150?u=${nextUserId2}`,
                phone: '+1234567892',
                role: 'Manager',
                teamId: 'team-realestate',
                permissions: ['view:all_leads', 'assign:leads'],
                isTrackingEnabled: false,
                organizationId: 'org-2'
            });
            console.log('✅ Created Realty Kings user:', realtyUser.name);
        } else {
            console.log('✅ Realty Kings user already exists:', realtyUser.name);
        }

        // 4. Display all users with their organizations
        const allUsers = await User.find({}).select('name email role organizationId');
        console.log('\n📋 All users in database:');
        allUsers.forEach(user => {
            const orgName = user.organizationId === 'org-1' ? 'Ed-Tech Global' :
                           user.organizationId === 'org-2' ? 'Realty Kings' :
                           user.organizationId === '' ? 'Super Admin (No Organization)' : 'Unknown';
            console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${orgName}`);
        });

        console.log('\n✅ User creation completed successfully!');
        console.log('\n🔑 Login Credentials:');
        console.log(`   Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
        console.log(`   Ed-Tech Global: ${edTechUserEmail} / password123`);
        console.log(`   Realty Kings: ${realtyUserEmail} / password123`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addOrganizationUsers();
}

export { addOrganizationUsers };




