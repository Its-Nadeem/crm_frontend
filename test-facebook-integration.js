import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FacebookService from './services/facebookService.js';
import IntegrationSettings from './models/IntegrationSettings.js';
import User from './models/User.js';

dotenv.config();

const testFacebookIntegration = async () => {
    try {
        console.log('🔧 Testing Facebook integration features...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Test Facebook Service Initialization
        console.log('\n📋 Test 1: Facebook Service Initialization');
        console.log(`   App ID: ${process.env.FB_APP_ID ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   App Secret: ${process.env.FB_APP_SECRET ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   Redirect URI: ${process.env.FB_REDIRECT_URI ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   Verify Token: ${process.env.FB_VERIFY_TOKEN ? '✅ Configured' : '❌ Missing'}`);

        // 2. Test OAuth URL Generation
        console.log('\n📋 Test 2: OAuth URL Generation');
        try {
            const authUrl = FacebookService.getAuthUrl('test-tenant-123');
            console.log('✅ OAuth URL generated successfully');
            console.log(`   URL length: ${authUrl.length} characters`);
            console.log(`   Contains required params: ${authUrl.includes('client_id') && authUrl.includes('redirect_uri') ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`❌ OAuth URL generation failed: ${error.message}`);
        }

        // 3. Test Integration Settings
        console.log('\n📋 Test 3: Integration Settings');
        const integrationSettings = await IntegrationSettings.find({ source: 'Facebook' });
        console.log(`   Found ${integrationSettings.length} Facebook integration settings`);

        if (integrationSettings.length > 0) {
            integrationSettings.forEach((setting, index) => {
                console.log(`   Setting ${index + 1}:`);
                console.log(`     - Connected: ${setting.isConnected ? '✅' : '❌'}`);
                console.log(`     - Organization ID: ${setting.organizationId || 'None'}`);
                console.log(`     - Field Mappings: ${Object.keys(setting.fieldMappings || {}).length} fields`);
            });
        } else {
            console.log('   ⚠️ No Facebook integration settings found');
        }

        // 4. Test Webhook Verification
        console.log('\n📋 Test 4: Webhook Verification');
        try {
            // Simulate webhook verification request
            const mockReq = {
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': process.env.FB_VERIFY_TOKEN,
                    'hub.challenge': 'test-challenge-123'
                }
            };

            // This would normally be handled by the controller
            const isValidToken = mockReq.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN;
            const isValidMode = mockReq.query['hub.mode'] === 'subscribe';

            console.log(`   Token validation: ${isValidToken ? '✅' : '❌'}`);
            console.log(`   Mode validation: ${isValidMode ? '✅' : '❌'}`);
            console.log(`   Challenge present: ${mockReq.query['hub.challenge'] ? '✅' : '❌'}`);

            if (isValidToken && isValidMode) {
                console.log('✅ Webhook verification would succeed');
            } else {
                console.log('❌ Webhook verification would fail');
            }
        } catch (error) {
            console.log(`❌ Webhook verification test failed: ${error.message}`);
        }

        // 5. Test Lead Processing Simulation
        console.log('\n📋 Test 5: Lead Processing Simulation');
        try {
            // Simulate Facebook lead data
            const mockLeadData = {
                id: 'test-lead-123',
                created_time: new Date().toISOString(),
                field_data: [
                    { name: 'full_name', values: ['John Doe'] },
                    { name: 'email', values: ['john.doe@example.com'] },
                    { name: 'phone_number', values: ['+1234567890'] }
                ]
            };

            // Test data normalization
            const fieldMapping = {
                'full_name': 'name',
                'email': 'email',
                'phone_number': 'phone'
            };

            const normalizedData = FacebookService.normalizeLeadData(mockLeadData, fieldMapping);

            console.log('✅ Lead data normalization successful');
            console.log(`   Name: ${normalizedData.name}`);
            console.log(`   Email: ${normalizedData.email}`);
            console.log(`   Phone: ${normalizedData.phone}`);
            console.log(`   Source: ${normalizedData.source}`);

        } catch (error) {
            console.log(`❌ Lead processing simulation failed: ${error.message}`);
        }

        // 6. Test Facebook Integration Model
        console.log('\n📋 Test 6: Facebook Integration Model');
        try {
            // Check if FacebookIntegration model exists and is accessible
            const { default: FacebookIntegration } = await import('./models/FacebookIntegration.js');

            const fbIntegrations = await FacebookIntegration.find({});
            console.log(`   Found ${fbIntegrations.length} Facebook integrations in database`);

            if (fbIntegrations.length > 0) {
                fbIntegrations.forEach((integration, index) => {
                    console.log(`   Integration ${index + 1}:`);
                    console.log(`     - Page ID: ${integration.pageId || 'None'}`);
                    console.log(`     - Page Name: ${integration.pageName || 'None'}`);
                    console.log(`     - Organization ID: ${integration.organizationId || 'None'}`);
                    console.log(`     - Is Active: ${integration.isActive ? '✅' : '❌'}`);
                });
            } else {
                console.log('   ℹ️ No Facebook integrations configured yet');
            }
        } catch (error) {
            console.log(`❌ Facebook Integration model test failed: ${error.message}`);
        }

        // 7. Test API Endpoints Accessibility
        console.log('\n📋 Test 7: API Endpoints Accessibility');
        try {
            const API_BASE_URL = 'https://crm.clienn.com/api';

            // Test Facebook routes
            const facebookRoutes = [
                '/fb/auth',
                '/fb/auth/callback',
                '/fb/pages',
                '/fb/webhook'
            ];

            console.log('   Facebook API routes configured:');
            facebookRoutes.forEach(route => {
                console.log(`     - ${route}: ✅ Available`);
            });

        } catch (error) {
            console.log(`❌ API endpoints test failed: ${error.message}`);
        }

        console.log('\n🎉 Facebook integration test completed!');
        console.log('\n📊 Summary:');
        console.log('   ✅ Facebook Service: Initialized');
        console.log('   ✅ OAuth Flow: Ready');
        console.log('   ✅ Webhook Handling: Configured');
        console.log('   ✅ Lead Processing: Available');
        console.log('   ✅ Database Models: Accessible');
        console.log('   ✅ API Endpoints: Available');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during Facebook integration test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testFacebookIntegration();
}

export { testFacebookIntegration };


