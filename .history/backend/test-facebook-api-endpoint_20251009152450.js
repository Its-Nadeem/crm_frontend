import dotenv from 'dotenv';

dotenv.config();

const testFacebookApiEndpoint = async () => {
    console.log('🔧 Testing Facebook API Endpoint');
    console.log('===============================');

    try {
        const API_BASE_URL = 'http://localhost:5000/api';

        // Test Facebook auth start endpoint
        console.log('\n1. Testing GET /api/fb/auth/start');
        try {
            const response = await fetch(`${API_BASE_URL}/fb/auth/start?tenantId=org-1`);

            if (response.ok) {
                const data = await response.json();
                console.log('   ✅ Facebook auth start endpoint working');
                console.log(`   Auth URL generated: ${data.authUrl ? '✅' : '❌'}`);
                console.log(`   Contains client_id: ${data.authUrl?.includes('1426664171873898') ? '✅' : '❌'}`);
            } else {
                console.log(`   ❌ Facebook auth start endpoint failed: ${response.status}`);
                const errorData = await response.json();
                console.log(`   Error: ${errorData.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Facebook auth start endpoint error: ${error.message}`);
        }

        // Test Facebook pages endpoint (should return 404 if no integration exists yet)
        console.log('\n2. Testing GET /api/fb/pages');
        try {
            const pagesResponse = await fetch(`${API_BASE_URL}/fb/pages?tenantId=org-1`);

            if (pagesResponse.status === 404) {
                console.log('   ✅ Facebook pages endpoint working (404 expected - no integration yet)');
            } else if (pagesResponse.ok) {
                console.log('   ✅ Facebook pages endpoint working');
            } else {
                console.log(`   ⚠️ Facebook pages endpoint returned: ${pagesResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Facebook pages endpoint error: ${error.message}`);
        }

        console.log('\n🎉 Facebook API Endpoint Test Completed!');
        console.log('=====================================');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testFacebookApiEndpoint();


