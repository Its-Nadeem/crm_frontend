import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Lead from './models/Lead.js';

dotenv.config();

const checkAllData = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Check Users
        const users = await User.find({});
        console.log(`\n👥 Total users in database: ${users.length}`);

        if (users.length > 0) {
            console.log('\n📋 User Details:');
            users.forEach((user, i) => {
                console.log(`${i+1}. Name: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Organization ID: ${user.organizationId || 'None'}`);
                console.log(`   Super Admin Role: ${user.superAdminRole || 'None'}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ No users found in database!');
        }

        // Check Organizations
        const organizations = await Organization.find({});
        console.log(`\n🏢 Total organizations in database: ${organizations.length}`);

        if (organizations.length > 0) {
            console.log('\n📋 Organization Details:');
            organizations.forEach((org, i) => {
                console.log(`${i+1}. Name: ${org.name}`);
                console.log(`   Code: ${org.code}`);
                console.log(`   API Key: ${org.apiKey}`);
                console.log(`   Enabled: ${org.isEnabled}`);
                console.log(`   Subscription Plan: ${org.subscriptionPlanId}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ No organizations found in database!');
        }

        // Check Leads (already seen 46)
        const leads = await Lead.find({});
        console.log(`\n📊 Total leads in database: ${leads.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAllData();


