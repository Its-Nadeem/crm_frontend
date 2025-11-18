import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import SubscriptionPlan from './models/SubscriptionPlan.js';

dotenv.config();

const testSubscriptionPlanFix = async () => {
    console.log('🔧 Testing Subscription Plan Fix');
    console.log('==============================');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check current organization
        console.log('\n1. Checking current organization...');
        const organization = await Organization.findOne({ id: 'org-1' });

        if (!organization) {
            console.log('❌ Organization org-1 not found');
            return;
        }

        console.log('✅ Organization found:', {
            id: organization.id,
            name: organization.name,
            subscriptionPlanId: organization.subscriptionPlanId,
            subscriptionExpiresAt: organization.subscriptionExpiresAt
        });

        // Check available subscription plans
        console.log('\n2. Checking available subscription plans...');
        const subscriptionPlans = await SubscriptionPlan.find({});
        console.log(`✅ Found ${subscriptionPlans.length} subscription plans:`);

        subscriptionPlans.forEach(plan => {
            console.log(`   - ${plan.id}: ${plan.name} (${plan.type})`);
        });

        // Check if organization's subscription plan exists
        console.log('\n3. Checking subscription plan matching...');
        let matchingPlan = subscriptionPlans.find(plan => plan.id === organization.subscriptionPlanId);

        // Try alternative matching
        if (!matchingPlan && organization.subscriptionPlanId === 'enterprise') {
            matchingPlan = subscriptionPlans.find(plan => plan.id === 'plan_enterprise');
        }

        if (matchingPlan) {
            console.log('✅ Subscription plan match found:', {
                id: matchingPlan.id,
                name: matchingPlan.name,
                type: matchingPlan.type
            });
        } else {
            console.log('❌ No matching subscription plan found');
            console.log('Available plan IDs:', subscriptionPlans.map(p => p.id));
            console.log('Organization plan ID:', organization.subscriptionPlanId);
        }

        // Test data controller logic
        console.log('\n4. Testing data controller logic...');
        const orgId = 'org-1';
        const [org, plans] = await Promise.all([
            Organization.findOne({ id: orgId }),
            SubscriptionPlan.find({})
        ]);

        const currentPlan = plans.find(plan => plan.id === org?.subscriptionPlanId);

        console.log('Data controller test results:');
        console.log('  Organization:', org ? {
            id: org.id,
            subscriptionPlanId: org.subscriptionPlanId
        } : 'Not found');

        console.log('  Current plan:', currentPlan ? {
            id: currentPlan.id,
            name: currentPlan.name
        } : 'Not found');

        console.log('  Plans count:', plans.length);

        // Test response structure
        console.log('\n5. Testing response structure...');
        const responseData = {
            organizations: [org],
            subscriptionPlans: plans,
            currentSubscriptionPlan: currentPlan,
            subscriptionPlanDetails: currentPlan
        };

        console.log('Response structure test:');
        console.log('  Organizations array length:', responseData.organizations.length);
        console.log('  Current subscription plan:', responseData.currentSubscriptionPlan ? 'Found' : 'Not found');
        console.log('  Subscription plan details:', responseData.subscriptionPlanDetails ? 'Found' : 'Not found');

        console.log('\n🎉 Subscription Plan Test Completed!');
        console.log('===================================');

        if (currentPlan) {
            console.log('✅ Subscription plan properly configured');
        } else {
            console.log('❌ Subscription plan configuration issue detected');
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

testSubscriptionPlanFix();


