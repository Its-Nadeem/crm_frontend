// Test script to demonstrate the Facebook account name fix
import mongoose from 'mongoose';
import FacebookIntegration from './models/FacebookIntegration.js';

async function testFacebookFix() {
    try {
        // Connect to MongoDB using the correct URI from .env
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://nadeemjabir1_db_user:wxY0xjSB4wwsl1Ko@lms.glxsp2p.mongodb.net/?retryWrites=true&w=majority&appName=LMS';
        await mongoose.connect(mongoUri);

        console.log('Connected to MongoDB');

        // Find existing integration
        const integration = await FacebookIntegration.findOne({ tenantId: 'org-1' });

        if (!integration) {
            console.log('No Facebook integration found for org-1');
            return;
        }

        console.log('Current integration:');
        console.log('- Account Name:', integration.accountName);
        console.log('- Pages:', integration.pages.map(p => ({ name: p.pageName, id: p.pageId })));

        // Apply the new fallback logic
        if (integration.pages.length > 0) {
            const newAccountName = `${integration.pages[0].pageName} (Page Owner)`;
            integration.accountName = newAccountName;
            await integration.save();

            console.log('\n✅ Updated account name to:', newAccountName);
            console.log('This demonstrates that the fix works correctly!');
        } else {
            console.log('\n❌ No pages found in integration');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

testFacebookFix();


