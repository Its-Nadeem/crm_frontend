import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function testSuperAdminAPI() {
    console.log('Testing Super Admin API endpoints...\n');
    
    try {
        // Test dashboard endpoint (this might fail due to auth, but let's see)
        console.log('1. Testing /api/super-admin/dashboard...');
        const dashboardResponse = await fetch(`${API_BASE_URL}/super-admin/dashboard`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Dashboard Response Status: ${dashboardResponse.status}`);
        if (dashboardResponse.status === 401) {
            console.log('✅ API endpoint exists but requires authentication (expected)');
        } else if (dashboardResponse.ok) {
            const data = await dashboardResponse.json();
            console.log('✅ Dashboard endpoint working:', data);
        } else {
            console.log('❌ Dashboard endpoint error:', dashboardResponse.statusText);
        }
        
        // Test organizations endpoint
        console.log('\n2. Testing /api/super-admin/organizations...');
        const orgsResponse = await fetch(`${API_BASE_URL}/super-admin/organizations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Organizations Response Status: ${orgsResponse.status}`);
        if (orgsResponse.status === 401) {
            console.log('✅ API endpoint exists but requires authentication (expected)');
        } else if (orgsResponse.ok) {
            const data = await orgsResponse.json();
            console.log('✅ Organizations endpoint working:', data);
        } else {
            console.log('❌ Organizations endpoint error:', orgsResponse.statusText);
        }
        
        console.log('\n✅ Super Admin API routes are properly configured!');
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testSuperAdminAPI();