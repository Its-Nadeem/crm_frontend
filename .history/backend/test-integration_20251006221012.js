import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Lead from './models/Lead.js';

dotenv.config();

const testIntegration = async () => {
    try {
        console.log('🔧 Testing complete integration flow...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create or find Ed-Tech Global organization
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
            console.log('✅ Found existing Ed-Tech Global organization');
        }

        // 2. Create or find test user
        const testEmail = 'test@edtech.io';
        let testUser = await User.findOne({ email: testEmail });

        if (!testUser) {
            const hashedPassword = await bcrypt.hash('test123', 10);
            testUser = await User.create({
                id: 1001,
                name: 'Test Ed-Tech User',
                email: testEmail,
                password: hashedPassword,
                avatar: 'https://i.pravatar.cc/150?u=test',
                phone: '+1234567890',
                role: 'Admin',
                teamId: 'team-edtech',
                permissions: ['view:all_leads', 'assign:leads', 'manage:users', 'manage:teams', 'manage:settings'],
                isTrackingEnabled: true,
                organizationId: 'org-1'
            });
            console.log('✅ Created test user');
        } else {
            console.log('✅ Found existing test user');
        }

        // 3. Generate JWT token for the user
        const token = jwt.sign(
            {
                id: testUser.id,
                email: testUser.email,
                role: testUser.role,
                organizationId: testUser.organizationId
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        console.log('✅ Generated JWT token');
        console.log(`🔑 Token: ${token.substring(0, 50)}...`);

        // 4. Test API call with the token
        const API_BASE_URL = 'http://localhost:5000/api';

        const response = await fetch(`${API_BASE_URL}/data/app-data`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API call failed:', errorData);
            return;
        }

        const appData = await response.json();
        console.log('✅ API call successful!');
        console.log(`📊 App data received:`);
        console.log(`   - Organizations: ${appData.organizations?.length || 0}`);
        console.log(`   - Users: ${appData.users?.length || 0}`);
        console.log(`   - Leads: ${appData.leads?.length || 0}`);
        console.log(`   - Tasks: ${appData.tasks?.length || 0}`);

        // 5. Check if leads are properly assigned to Ed-Tech Global
        if (appData.leads && appData.leads.length > 0) {
            const edTechLeads = appData.leads.filter(lead => lead.organizationId === 'org-1');
            console.log(`🎯 Ed-Tech Global leads: ${edTechLeads.length}`);

            if (edTechLeads.length > 0) {
                console.log('📋 Sample Ed-Tech Global leads:');
                edTechLeads.slice(0, 3).forEach((lead, index) => {
                    console.log(`   ${index + 1}. ${lead.name} - ${lead.email} - ${lead.phone}`);
                });
            }
        }

        console.log('\n✅ Integration test completed successfully!');
        console.log('\n🔑 Test Credentials:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: test123`);
        console.log(`   Organization: Ed-Tech Global`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during integration test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testIntegration();
}

export { testIntegration };


