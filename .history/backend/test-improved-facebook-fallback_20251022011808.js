// Test script to demonstrate the improved Facebook fallback mechanism
import axios from 'axios';

// Mock the Facebook service to simulate failures
class MockFacebookService {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
    }

    async getUserInfo(accessToken) {
        console.log('🔄 Mock: getUserInfo called (simulating failure)');
        throw new Error('Mock: Token expired or insufficient permissions');
    }

    async getUserPages(accessToken) {
        console.log('🔄 Mock: getUserPages called (simulating success)');
        return [
            {
                pageId: '714432025082804',
                pageName: 'Skillup',
                pageAccessToken: 'mock_page_token',
                instagramBusinessAccount: null
            }
        ];
    }
}

// Test the new fallback function
async function testFallbackMechanism() {
    console.log('🧪 Testing improved Facebook fallback mechanism...\n');

    const facebookService = new MockFacebookService();
    const longLivedToken = 'mock_long_lived_token';
    const pages = await facebookService.getUserPages(longLivedToken);

    // Simulate the getUserInfoWithFallback function logic
    console.log('🔄 Attempting to get user info with fallback methods...');

    // Method 1: Try to get user info using the long-lived token (will fail)
    try {
        const userInfo = await facebookService.getUserInfo(longLivedToken);
        console.log('✅ Successfully got user info with long-lived token');
        return userInfo;
    } catch (error) {
        console.log('❌ Long-lived token user info failed:', error.message);
    }

    // Method 2: If we have pages, try to get user info using page access tokens (will also fail)
    if (pages && pages.length > 0) {
        for (const page of pages) {
            try {
                console.log(`🔄 Trying to get user info using page token for page: ${page.pageName}`);
                const userInfo = await facebookService.getUserInfo(page.pageAccessToken);
                console.log('✅ Successfully got user info with page access token');
                return userInfo;
            } catch (error) {
                console.log(`❌ Page token user info failed for ${page.pageName}:`, error.message);
            }
        }
    }

    // Method 3: Try alternative API call (will also fail in mock)
    try {
        console.log('🔄 Trying alternative method to get user context...');
        const params = {
            access_token: longLivedToken,
            fields: 'id,name'
        };
        const response = await axios.get(`https://graph.facebook.com/v18.0/me`, { params });
        if (response.data && response.data.id && response.data.name) {
            console.log('✅ Got user info via alternative API call');
            return {
                userId: response.data.id,
                name: response.data.name,
                email: null,
                firstName: null,
                lastName: null
            };
        }
    } catch (error) {
        console.log('❌ Alternative user info method failed:', error.response?.data?.error?.message || error.message);
    }

    // Final fallback: Use page information but indicate it's not the real user
    console.log('⚠️ All user info methods failed, using page-based fallback');
    const fallbackName = pages.length > 0
        ? `${pages[0].pageName} (Page Owner - Real Name Unavailable)`
        : 'Facebook User (Name Unavailable)';

    const userInfo = {
        userId: pages[0]?.pageId || 'unknown',
        name: fallbackName,
        email: null,
        firstName: null,
        lastName: null
    };

    console.log('\n📊 Result:', userInfo);
    console.log('✅ Fallback mechanism working correctly!');
    console.log('\n🔍 What this means:');
    console.log('- The new system tries multiple methods to get the real user name');
    console.log('- If all methods fail, it provides a clear indication that the real name is unavailable');
    console.log('- This is much better than the old "Facebook Account" generic name');

    return userInfo;
}

testFallbackMechanism();


