#!/usr/bin/env node

/**
 * Facebook Integration End-to-End Test Script
 *
 * This script tests the complete Facebook integration flow including:
 * - OAuth authentication flow
 * - Account and page management
 * - Form fetching and field mapping
 * - Lead synchronization
 * - Webhook handling
 *
 * Run with: node test-facebook-integration.js
 */

// Using built-in fetch API instead of axios

// Test configuration
const BASE_URL = 'https://crm.clienn.com';
const TEST_TENANT_ID = 'test-tenant-123';

class FacebookIntegrationTester {
    constructor() {
        this.baseURL = BASE_URL;
        this.tenantId = TEST_TENANT_ID;
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    // Test helper methods
    async makeRequest(method, endpoint, data = null, useAuth = true) {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            if (useAuth) {
                headers.Cookie = 'session=test-session'; // Mock auth
            }

            const config = {
                method,
                headers
            };

            let url = `${this.baseURL}${endpoint}`;
            let body = null;

            if (data && (method === 'POST' || method === 'PUT')) {
                body = JSON.stringify(data);
            } else if (data && method === 'GET') {
                // Add query parameters for GET requests
                const params = new URLSearchParams(data).toString();
                url += `?${params}`;
            }

            const response = await fetch(url, { ...config, body });

            let responseData;
            try {
                responseData = await response.json();
            } catch {
                responseData = await response.text();
            }

            if (response.ok) {
                return { success: true, data: responseData, status: response.status };
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    status: response.status,
                    data: responseData
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: null,
                data: null
            };
        }
    }

    logTest(testName, passed, message = '') {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
            console.log(`✅ ${testName}${message ? ': ' + message : ''}`);
        } else {
            this.testResults.failed++;
            console.log(`❌ ${testName}${message ? ': ' + message : ''}`);
        }

        this.testResults.tests.push({
            name: testName,
            passed,
            message
        });
    }

    // Test cases
    async testHealthCheck() {
        console.log('\n🔍 Testing Health Check...');
        const result = await this.makeRequest('GET', '/api/health', null, false);

        if (result.success && result.data.status === 'OK') {
            this.logTest('Health Check', true, 'Server is responding');
        } else {
            this.logTest('Health Check', false, result.error || 'Server not responding');
        }
    }

    async testFacebookAuthStart() {
        console.log('\n🔐 Testing Facebook OAuth Start...');
        const result = await this.makeRequest('GET', `/api/fb/auth/start?tenantId=${this.tenantId}`);

        if (result.success && result.data.authUrl) {
            this.logTest('Facebook OAuth Start', true, 'Auth URL generated successfully');
        } else {
            this.logTest('Facebook OAuth Start', false, result.error || 'Failed to generate auth URL');
        }
    }

    async testFacebookPagesFetch() {
        console.log('\n📄 Testing Facebook Pages Fetch...');
        const result = await this.makeRequest('GET', `/api/fb/pages?tenantId=${this.tenantId}`);

        if (result.success && Array.isArray(result.data.pages)) {
            this.logTest('Facebook Pages Fetch', true, `Found ${result.data.pages.length} pages`);
        } else {
            this.logTest('Facebook Pages Fetch', false, result.error || 'Failed to fetch pages');
        }
    }

    async testFacebookFormsFetch() {
        console.log('\n📋 Testing Facebook Forms Fetch...');
        const result = await this.makeRequest('GET', `/api/fb/forms?pageId=test-page-123&tenantId=${this.tenantId}`);

        if (result.success && Array.isArray(result.data.forms)) {
            this.logTest('Facebook Forms Fetch', true, `Found ${result.data.forms.length} forms`);
        } else {
            this.logTest('Facebook Forms Fetch', false, result.error || 'Failed to fetch forms');
        }
    }

    async testFieldMappingSave() {
        console.log('\n🗺️ Testing Field Mapping Save...');
        const fieldMapping = {
            'full_name': 'name',
            'email': 'email',
            'phone_number': 'phone',
            'company_name': 'company'
        };

        const result = await this.makeRequest('POST', '/api/fb/forms/test-form-123/map', {
            pageId: 'test-page-123',
            tenantId: this.tenantId,
            fieldMapping
        });

        if (result.success) {
            this.logTest('Field Mapping Save', true, 'Field mapping saved successfully');
        } else {
            this.logTest('Field Mapping Save', false, result.error || 'Failed to save field mapping');
        }
    }

    async testFieldMappingFetch() {
        console.log('\n📖 Testing Field Mapping Fetch...');
        const result = await this.makeRequest('GET', `/api/fb/forms/test-form-123/map?tenantId=${this.tenantId}`);

        if (result.success && result.data.mapping) {
            this.logTest('Field Mapping Fetch', true, 'Field mapping retrieved successfully');
        } else {
            this.logTest('Field Mapping Fetch', false, result.error || 'Failed to fetch field mapping');
        }
    }

    async testLeadSync() {
        console.log('\n🔄 Testing Lead Sync...');
        const result = await this.makeRequest('POST', '/api/fb/sync/backfill', {
            formId: 'test-form-123',
            pageId: 'test-page-123',
            tenantId: this.tenantId,
            since: '2024-01-01',
            until: '2024-12-31'
        });

        if (result.success && Array.isArray(result.data.results)) {
            this.logTest('Lead Sync', true, `Processed ${result.data.results.length} leads`);
        } else {
            this.logTest('Lead Sync', false, result.error || 'Failed to sync leads');
        }
    }

    async testWebhookVerification() {
        console.log('\n🪝 Testing Webhook Verification...');
        const result = await this.makeRequest('GET', '/webhook/facebook?hub.mode=subscribe&hub.challenge=test-challenge&hub.verify_token=fb_webhook_verify_token_2024_Clienn CRM_secure', null, false);

        if (result.success && result.data === 'test-challenge') {
            this.logTest('Webhook Verification', true, 'Webhook verification successful');
        } else {
            this.logTest('Webhook Verification', false, result.error || 'Webhook verification failed');
        }
    }

    async testAllMappingsFetch() {
        console.log('\n📚 Testing All Mappings Fetch...');
        const result = await this.makeRequest('GET', `/api/fb/mappings?tenantId=${this.tenantId}`);

        if (result.success && Array.isArray(result.data.mappings)) {
            this.logTest('All Mappings Fetch', true, `Found ${result.data.mappings.length} mappings`);
        } else {
            this.logTest('All Mappings Fetch', false, result.error || 'Failed to fetch mappings');
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Facebook Integration Tests...\n');

        await this.testHealthCheck();
        await this.testFacebookAuthStart();
        await this.testFacebookPagesFetch();
        await this.testFacebookFormsFetch();
        await this.testFieldMappingSave();
        await this.testFieldMappingFetch();
        await this.testLeadSync();
        await this.testWebhookVerification();
        await this.testAllMappingsFetch();

        // Summary
        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

        if (this.testResults.failed === 0) {
            console.log('\n🎉 All tests passed! Facebook integration is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the implementation.');
            console.log('\nFailed tests:');
            this.testResults.tests
                .filter(test => !test.passed)
                .forEach(test => console.log(`- ${test.name}: ${test.message}`));
        }

        return this.testResults;
    }
}

// Manual test runner
async function runManualTests() {
    const tester = new FacebookIntegrationTester();

    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('Test execution failed:', error.message);
    }
}

// Integration flow test
async function testIntegrationFlow() {
    console.log('🔄 Testing Complete Integration Flow...\n');

    const tester = new FacebookIntegrationTester();

    // Step 1: Check if server is running
    console.log('Step 1: Health Check');
    const healthResult = await tester.makeRequest('GET', '/api/health', null, false);
    if (!healthResult.success) {
        console.log('❌ Server not responding. Please start the server first.');
        return;
    }
    console.log('✅ Server is running');

    // Step 2: Test OAuth flow initiation
    console.log('\nStep 2: OAuth Flow');
    const authResult = await tester.makeRequest('GET', `/api/fb/auth/start?tenantId=${tester.tenantId}`);
    if (authResult.success) {
        console.log('✅ OAuth URL generated');
        console.log(`   URL: ${authResult.data.authUrl}`);
    } else {
        console.log('❌ OAuth flow failed');
    }

    // Step 3: Test pages and forms (would work if authenticated)
    console.log('\nStep 3: Pages & Forms');
    const pagesResult = await tester.makeRequest('GET', `/api/fb/pages?tenantId=${tester.tenantId}`);
    if (pagesResult.success) {
        console.log(`✅ Pages fetched: ${pagesResult.data.pages?.length || 0}`);
    } else {
        console.log('❌ Pages fetch failed (expected if not authenticated)');
    }

    // Step 4: Test field mapping
    console.log('\nStep 4: Field Mapping');
    const mappingResult = await tester.makeRequest('POST', '/api/fb/forms/test-form/map', {
        pageId: 'test-page',
        tenantId: tester.tenantId,
        fieldMapping: { 'email': 'email', 'name': 'name' }
    });
    if (mappingResult.success) {
        console.log('✅ Field mapping saved');
    } else {
        console.log('❌ Field mapping failed (expected if not authenticated)');
    }

    console.log('\n🎯 Integration Flow Test Complete');
    console.log('\nTo test with real Facebook account:');
    console.log('1. Start the backend server');
    console.log('2. Open browser and navigate to: https://crm.clienn.com/api/fb/auth/start?tenantId=test-tenant-123');
    console.log('3. Complete Facebook OAuth flow');
    console.log('4. Return to this terminal and run the full test suite');
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--flow')) {
        testIntegrationFlow();
    } else {
        runManualTests();
    }
}

module.exports = { FacebookIntegrationTester, runManualTests, testIntegrationFlow };


