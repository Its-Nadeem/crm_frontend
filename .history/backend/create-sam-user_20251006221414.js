import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'dotenv';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const createSamUser = async () => {
    try {
        console.log('🔧 Creating sam@edtech.io user...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Ensure Ed-Tech Global organization exists
        let edTechOrg = await Organization.findOne({ id: 'org-1' });
        if (!edTechOrg) {
            edTechOrg = await Organization.create({
                id: 'org-1',
                name: 'Ed-Tech Global',
                code: 'edtech-global',
                subscriptionPlanId: 'plan-1',
                subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                isEnabled: true,
                hasBlogAccess: true,
                logoUrl: 'https://i.pravatar.cc/150?u=edtech'
            });
            console.log('✅ Created Ed-Tech Global organization');
        } else {
            console.log('✅ Ed-Tech Global organization already exists');
        }

        // 2. Check if sam@edtech.io already exists
        const samEmail = 'sam@edtech.io';
        let samUser = await User.findOne({ email: samEmail });

        if (samUser) {
            console.log('✅ sam@edtech.io already exists, updating organization...');
            // Update existing user to ensure proper organization assignment
            samUser.organizationId = 'org-1';
            samUser.role = 'Admin';
            samUser.permissions = ['view:all_leads', 'assign:leads', 'manage:users', 'manage:teams', 'manage:settings'];
            await samUser.save();
            console.log('✅ Updated sam@edtech.io with proper organization');
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash('sam123', 10);
            const nextUserId = Math.max(...(await User.find({}).select('id')).map(u => u.id), 0) + 1;

            samUser = await User.create({
                id: nextUserId,
                name: 'Sam (Ed-Tech Global)',
                email: samEmail,
                password: hashedPassword,
                avatar: `https://i.pravatar.cc/150?u=sam`,
                phone: '+1234567890',
                role: 'Admin',
                teamId: 'team-edtech',
                permissions: ['view:all_leads', 'assign:leads', 'manage:users', 'manage:teams', 'manage:settings'],
                isTrackingEnabled: true,
                organizationId: 'org-1'
            });
            console.log('✅ Created sam@edtech.io user');
        }

        // 3. Display confirmation
        console.log('\n📋 User Details:');
        console.log(`   Name: ${samUser.name}`);
        console.log(`   Email: ${samUser.email}`);
        console.log(`   Role: ${samUser.role}`);
        console.log(`   Organization ID: ${samUser.organizationId}`);
        console.log(`   Permissions: ${samUser.permissions.join(', ')}`);

        console.log('\n🔑 Login Credentials:');
        console.log(`   Email: ${samEmail}`);
        console.log(`   Password: sam123`);
        console.log(`   Organization: Ed-Tech Global`);

        console.log('\n✅ sam@edtech.io setup completed successfully!');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createSamUser();
}

export { createSamUser };


