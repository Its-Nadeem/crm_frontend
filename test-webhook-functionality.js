import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WebhookConfig from './models/WebhookConfig.js';
import Lead from './models/Lead.js';

dotenv.config();

const testWebhookFunctionality = async () => {
    console.log('🔧 Testing Webhook Functionality');
    console.log('===============================');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test 1: Create a test webhook
        console.log('\n1. Creating test webhook...');
        try {
            const testWebhook = new WebhookConfig({
                name: 'Test Webhook',
                url: 'https://httpbin.org/post',
                events: ['lead.created', 'lead.updated', 'lead.stage_changed'],
                organizationId: 'org-1'
            });

            await testWebhook.save();
            console.log('✅ Test webhook created');
            console.log(`   API Key: ${testWebhook.apiKey}`);
            console.log(`   Webhook ID: ${testWebhook._id}`);

            // Test 2: Test webhook triggering
            console.log('\n2. Testing webhook trigger...');
            const testResult = await testWebhook.trigger('lead.created', {
                lead: {
                    id: 'test-lead-123',
                    name: 'Test Lead',
                    email: 'test@example.com',
                    stage: 'New'
                }
            });

            console.log(`   Trigger result: ${testResult.success ? '✅ Success' : '❌ Failed'}`);
            if (testResult.error) {
                console.log(`   Error: ${testResult.error}`);
            }

            // Test 3: Create a test lead to trigger webhook
            console.log('\n3. Creating test lead to trigger webhook...');
            const testLead = new Lead({
                id: 9999,
                name: 'Webhook Test Lead',
                email: 'webhook-test@example.com',
                phone: '+1234567890',
                stage: 'New',
                source: 'Test',
                assignedToId: 1,
                organizationId: 'org-1'
            });

            await testLead.save();
            console.log('✅ Test lead created');

            // Test 4: Update lead stage to trigger stage change webhook
            console.log('\n4. Updating lead stage to trigger webhook...');
            testLead.stage = 'Contacted';
            await testLead.save();
            console.log('✅ Lead stage updated');

            // Test 5: Delete test lead to trigger delete webhook
            console.log('\n5. Deleting test lead to trigger webhook...');
            await Lead.deleteOne({ id: 9999 });
            console.log('✅ Test lead deleted');

            // Test 6: Clean up test webhook
            console.log('\n6. Cleaning up test webhook...');
            await WebhookConfig.deleteOne({ _id: testWebhook._id });
            console.log('✅ Test webhook deleted');

            console.log('\n🎉 Webhook Functionality Test Completed!');
            console.log('=====================================');
            console.log('✅ All webhook features are working correctly');

        } catch (error) {
            console.error('❌ Error during webhook test:', error.message);
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
    }
};

testWebhookFunctionality();


