import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

const testSamLogin = async () => {
    try {
        console.log('🔧 Testing sam@edtech.io login...');

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
        }

        // 2. Create or update sam@edtech.io user
        const samEmail = 'sam@edtech.io';
        let samUser = await User.findOne({ email: samEmail });

        if (!samUser) {
            // Create new user (password will be hashed by model)
            samUser = await User.create({
                id: 1002,
                name: 'Sam (Ed-Tech Global)',
                email: samEmail,
                password: 'sam123', // Will be hashed by pre-save hook
                avatar: 'https://i.pravatar.cc/150?u=sam',
                phone: '+1234567890',
                role: 'Admin',
                teamId: 'team-edtech',
                permissions: ['view:all_leads', 'assign:leads', 'manage:users', 'manage:teams', 'manage:settings'],
                isTrackingEnabled: true,
                organizationId: 'org-1'
            });
            console.log('✅ Created sam@edtech.io user');
        } else {
            console.log('✅ sam@edtech.io already exists');
        }

        // 3. Test password matching
        const passwordMatch = await samUser.matchPassword('sam123');
        console.log(`🔑 Password match test: ${passwordMatch}`);

        // 4. Generate token
        const token = jwt.sign(
            { id: samUser.id, email: samUser.email, role: samUser.role, organizationId: samUser.organizationId },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        console.log('✅ Generated JWT token');

        // 5. Test API call
        const API_BASE_URL = 'https://crm.clienn.com/api';
        const response = await fetch(`${API_BASE_URL}/data/app-data`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const appData = await response.json();
            console.log('✅ API call successful!');
            console.log(`📊 Data received:`);
            console.log(`   - Leads: ${appData.leads?.length || 0}`);
            console.log(`   - Users: ${appData.users?.length || 0}`);
            console.log(`   - Organizations: ${appData.organizations?.length || 0}`);

            if (appData.leads && appData.leads.length > 0) {
                console.log('🎯 Ed-Tech Global leads:');
                appData.leads.forEach((lead, index) => {
                    console.log(`   ${index + 1}. ${lead.name} - ${lead.email} - ${lead.phone}`);
                });
            }
        } else {
            console.error('❌ API call failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }

        console.log('\n✅ Test completed successfully!');
        console.log('\n🔑 Login Credentials:');
        console.log(`   Email: ${samEmail}`);
        console.log(`   Password: sam123`);
        console.log(`   Organization: Ed-Tech Global`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSamLogin();
}

export { testSamLogin };


