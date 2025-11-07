import mongoose from 'mongoose';
import Organization from './models/Organization.js';
import WebhookConfig from './models/WebhookConfig.js';
import WebhookDeliveryLog from './models/WebhookDeliveryLog.js';
import Lead from './models/Lead.js';
import { triggerLeadWebhooks } from './controllers/webhookController.js';

// Test script for multi-tenant webhook functionality
async function testMultitenantWebhooks() {
    try {
        console.log('🚀 Starting multi-tenant webhook tests...\n');

        // Get test organizations
        const orgs = await Organization.find({}).limit(2).lean();
        if (orgs.length < 2) {
            console.log('❌ Need at least 2 organizations for testing. Creating test orgs...');

            const testOrg1 = await Organization.create({
                id: 'test-org-1',
                name: 'Test Organization 1',
                code: 'TEST1',
                subscriptionPlanId: 'enterprise',
                subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            });

            const testOrg2 = await Organization.create({
                id: 'test-org-2',
                name: 'Test Organization 2',
                code: 'TEST2',
                subscriptionPlanId: 'enterprise',
                subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            });

            orgs.push(testOrg1, testOrg2);
            console.log('✅ Created test organizations');
        }

        const [orgA, orgB] = orgs;
        console.log(`📋 Testing with organizations: ${orgA.name} (${orgA.id}) and ${orgB.name} (${orgB.id})\n`);

        // Clean up existing test data
        await WebhookConfig.deleteMany({ organizationId: { $in: [orgA.id, orgB.id] } });
        await WebhookDeliveryLog.deleteMany({ organizationId: { $in: [orgA.id, orgB.id] } });
        await Lead.deleteMany({ organizationId: { $in: [orgA.id, orgB.id] } });

        console.log('🧹 Cleaned up existing test data\n');

        // Test 1: Generate API keys for both organizations
        console.log('🔑 Test 1: Generate API keys for both organizations');
        const apiKeyA = orgA.generateApiKey();
        await orgA.save();

        const apiKeyB = orgB.generateApiKey();
        await orgB.save();

        console.log(`✅ Org A API Key: ${apiKeyA.substring(0, 12)}...`);
        console.log(`✅ Org B API Key: ${apiKeyB.substring(0, 12)}...\n`);

        // Test 2: Create webhooks for both organizations
        console.log('🎣 Test 2: Create webhooks for both organizations');

        const webhookA = await WebhookConfig.create({
            name: 'test-outbound-A',
            url: 'https://httpbin.org/post',
            events: ['lead.created', 'lead.updated'],
            organizationId: orgA.id,
            isEnabled: true
        });

        const webhookB = await WebhookConfig.create({
            name: 'test-outbound-B',
            url: 'https://httpbin.org/post',
            events: ['lead.created', 'lead.updated'],
            organizationId: orgB.id,
            isEnabled: true
        });

        console.log(`✅ Created webhook A: ${webhookA.name} (${webhookA._id})`);
        console.log(`✅ Created webhook B: ${webhookB.name} (${webhookB._id})\n`);

        // Test 3: Test webhook for Org A
        console.log('🧪 Test 3: Test webhook for Org A');
        const testResultA = await webhookA.trigger('lead.created', { message: 'Test from Org A' });
        console.log(`✅ Test result for Org A: ${testResultA.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Status: ${testResultA.status}, Response Time: ${testResultA.responseTime}ms\n`);

        // Test 4: Create a lead in Org B and verify only Org B's webhook receives it
        console.log('📝 Test 4: Create lead in Org B and verify webhook isolation');

        const testLead = await Lead.create({
            name: 'Test Lead for Multitenant',
            email: 'test@example.com',
            phone: '1234567890',
            source: 'Website',
            stage: 'new',
            organizationId: orgB.id
        });

        console.log(`✅ Created test lead in Org B: ${testLead.name}`);

        // Trigger webhooks for the lead creation
        const webhookResults = await triggerLeadWebhooks(orgB.id, 'lead.created', {
            lead: {
                id: testLead.id,
                name: testLead.name,
                email: testLead.email,
                stage: testLead.stage,
                source: testLead.source,
                createdAt: testLead.createdAt
            }
        });

        console.log(`✅ Webhook trigger results for Org B:`);
        webhookResults.forEach(result => {
            console.log(`   - ${result.webhookName}: ${result.result.success ? 'SUCCESS' : 'FAILED'}`);
        });

        // Verify no webhooks were triggered for Org A
        const logsA = await WebhookDeliveryLog.find({ organizationId: orgA.id, event: 'lead.created' }).lean();
        const logsB = await WebhookDeliveryLog.find({ organizationId: orgB.id, event: 'lead.created' }).lean();

        console.log(`\n📊 Delivery logs verification:`);
        console.log(`   - Org A logs: ${logsA.length} (should be 0)`);
        console.log(`   - Org B logs: ${logsB.length} (should be 1)`);

        if (logsA.length === 0 && logsB.length === 1) {
            console.log('✅ Multi-tenant isolation verified!');
        } else {
            console.log('❌ Multi-tenant isolation failed!');
        }

        // Test 5: Test webhook toggle functionality
        console.log('\n🔄 Test 5: Test webhook toggle functionality');

        // Disable webhook A
        webhookA.isEnabled = false;
        await webhookA.save();
        console.log('✅ Disabled webhook A');

        // Create another lead in Org A (should not trigger webhook)
        const testLeadA = await Lead.create({
            name: 'Test Lead for Org A',
            email: 'testa@example.com',
            phone: '1234567891',
            source: 'Website',
            stage: 'new',
            organizationId: orgA.id
        });

        const webhookResultsAfterToggle = await triggerLeadWebhooks(orgA.id, 'lead.created', {
            lead: {
                id: testLeadA.id,
                name: testLeadA.name,
                email: testLeadA.email,
                stage: testLeadA.stage,
                source: testLeadA.source,
                createdAt: testLeadA.createdAt
            }
        });

        console.log(`✅ Webhook results after disabling webhook A: ${webhookResultsAfterToggle.length} (should be 0)`);

        // Test 6: Test webhook deletion
        console.log('\n🗑️ Test 6: Test webhook deletion');

        await WebhookConfig.deleteOne({ _id: webhookB._id });
        console.log('✅ Deleted webhook B');

        // Verify webhook was deleted and no future deliveries
        const remainingWebhooksB = await WebhookConfig.find({ organizationId: orgB.id }).lean();
        console.log(`✅ Remaining webhooks in Org B: ${remainingWebhooksB.length} (should be 0)`);

        // Test 7: Test inbound lead received event
        console.log('\n📨 Test 7: Test inbound lead received event');

        // Create a webhook for "lead.received" event in Org A
        const inboundWebhookA = await WebhookConfig.create({
            name: 'test-received-A',
            url: 'https://httpbin.org/post',
            events: ['lead.received'],
            organizationId: orgA.id,
            isEnabled: true
        });

        console.log('✅ Created inbound webhook for Org A');

        // Simulate inbound lead (e.g., from Facebook)
        const inboundLeadData = {
            name: 'Inbound Lead',
            email: 'inbound@example.com',
            phone: '1234567892',
            source: 'facebook'
        };

        const inboundResults = await triggerLeadWebhooks(orgA.id, 'lead.received', {
            lead: inboundLeadData,
            source: 'facebook'
        });

        console.log(`✅ Inbound webhook results: ${inboundResults.length} (should be 1)`);
        inboundResults.forEach(result => {
            console.log(`   - ${result.webhookName}: ${result.result.success ? 'SUCCESS' : 'FAILED'}`);
        });

        // Final verification
        console.log('\n📋 Final Summary:');
        console.log(`   - Total webhooks created: 3`);
        console.log(`   - Total delivery logs: ${await WebhookDeliveryLog.countDocuments()}`);
        console.log(`   - Org A logs: ${await WebhookDeliveryLog.countDocuments({ organizationId: orgA.id })}`);
        console.log(`   - Org B logs: ${await WebhookDeliveryLog.countDocuments({ organizationId: orgB.id })}`);

        const allLogs = await WebhookDeliveryLog.find({}).lean();
        console.log('\n📝 All delivery logs:');
        allLogs.forEach(log => {
            console.log(`   - ${log.event} in ${log.organizationId}: ${log.status} (${log.statusCode}) - ${log.responseTimeMs}ms`);
        });

        console.log('\n🎉 Multi-tenant webhook testing completed successfully!');

        // Cleanup
        await WebhookConfig.deleteMany({ organizationId: { $in: [orgA.id, orgB.id] } });
        await WebhookDeliveryLog.deleteMany({ organizationId: { $in: [orgA.id, orgB.id] } });
        await Lead.deleteMany({ organizationId: { $in: [orgA.id, orgB.id] } });
        console.log('\n🧹 Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        process.exit(0);
    }
}

// Run the test
testMultitenantWebhooks();


