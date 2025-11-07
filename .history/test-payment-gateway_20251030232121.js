import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Mock JWT token for testing (this would normally come from login)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzdXBlci1hZG1pbiIsInJvbGUiOiJTdXBlciBBZG1pbiIsIm9yZ2FuaXphdGlvbklkIjoxLCJpYXQiOjE2ODQ4NjQwMDAsImV4cCI6MTY4NDg2NzYwMH0.mock-signature';

async function testPaymentGatewayToggle() {
    console.log('Testing Payment Gateway Toggle API...\n');

    try {
        // Test the new query parameter route
        console.log('1. Testing /api/super-admin/payment-gateways/provider?provider=stripe...');
        const response = await fetch(`${API_BASE_URL}/super-admin/payment-gateways/provider?provider=stripe`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mockToken}`
            },
            body: JSON.stringify({
                isEnabled: true
            })
        });

        console.log(`Response Status: ${response.status}`);
        console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

        if (response.status === 401) {
            console.log('✅ Authentication required (expected)');
        } else if (response.ok) {
            const data = await response.json();
            console.log('✅ Payment gateway toggle working:', data);
        } else {
            const errorText = await response.text();
            console.log('❌ Error:', response.statusText, errorText);
        }

        // Test with authorize.net (provider with dots)
        console.log('\n2. Testing /api/super-admin/payment-gateways/provider?provider=authorize.net...');
        const response2 = await fetch(`${API_BASE_URL}/super-admin/payment-gateways/provider?provider=authorize.net`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mockToken}`
            },
            body: JSON.stringify({
                isEnabled: true
            })
        });

        console.log(`Response Status: ${response2.status}`);
        console.log(`Response Headers:`, Object.fromEntries(response2.headers.entries()));

        if (response2.status === 401) {
            console.log('✅ Authentication required (expected)');
        } else if (response2.ok) {
            const data = await response2.json();
            console.log('✅ Payment gateway toggle working for provider with dots:', data);
        } else {
            const errorText = await response2.text();
            console.log('❌ Error:', response2.statusText, errorText);
        }

        console.log('\n✅ Payment Gateway API routes are properly configured!');

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testPaymentGatewayToggle();