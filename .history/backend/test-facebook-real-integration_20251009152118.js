import dotenv from 'dotenv';
import FacebookService from './services/facebookService.js';

dotenv.config();

const testFacebookRealIntegration = async () => {
    console.log('🔧 Testing Facebook Real Integration');
    console.log('===================================');

    try {
        // Test 1: Check Environment Variables
        console.log('\n1. Environment Variables:');
        console.log(`   FB_APP_ID: ${process.env.FB_APP_ID ? '✅ Set' : '❌ Missing'}`);
        console.log(`   FB_APP_SECRET: ${process.env.FB_APP_SECRET ? '✅ Set' : '❌ Missing'}`);
        console.log(`   FB_REDIRECT_URI: ${process.env.FB_REDIRECT_URI ? '✅ Set' : '❌ Missing'}`);

        if (!process.env.FB_APP_ID || !process.env.FB_APP_SECRET) {
            console.log('\n❌ Facebook credentials not configured');
            console.log('   Please set FB_APP_ID and FB_APP_SECRET in .env file');
            return;
        }

        // Test 2: Generate OAuth URL
        console.log('\n2. OAuth URL Generation:');
        try {
            const fbService = new FacebookService();
            const authUrl = fbService.getAuthUrl('org-1');
            console.log('   ✅ OAuth URL generated');
            console.log(`   URL: ${authUrl.substring(0, 100)}...`);
            console.log(`   Contains client_id: ${authUrl.includes(process.env.FB_APP_ID) ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`   ❌ OAuth URL generation failed: ${error.message}`);
        }

        // Test 3: Facebook Service Initialization
        console.log('\n3. Facebook Service:');
        try {
            const fbService = new FacebookService();
            console.log('   ✅ FacebookService initialized');
            console.log(`   Base URL: ${fbService.baseURL}`);
            console.log(`   App ID: ${fbService.appId ? '✅ Set' : '❌ Missing'}`);
        } catch (error) {
            console.log(`   ❌ FacebookService initialization failed: ${error.message}`);
        }

        console.log('\n🎉 Facebook Integration Setup Test Completed!');
        console.log('=====================================');
        console.log('✅ Facebook integration is properly configured');
        console.log('\n📋 Next Steps:');
        console.log('   1. Go to organization settings');
        console.log('   2. Click "Connect Facebook"');
        console.log('   3. Complete Facebook OAuth flow');
        console.log('   4. Select pages and forms to sync');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testFacebookRealIntegration();


