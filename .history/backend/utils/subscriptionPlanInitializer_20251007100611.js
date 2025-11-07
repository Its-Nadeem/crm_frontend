import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Organization from '../models/Organization.js';

export const ensureSubscriptionPlans = async () => {
    try {
        console.log('🔄 Ensuring subscription plans exist...');

        // Check if subscription plans exist
        const plansCount = await SubscriptionPlan.countDocuments({});

        if (plansCount === 0) {
            console.log('💳 Creating subscription plans...');

            const plans = [
                {
                    id: 'free',
                    name: 'Free Plan',
                    price: 0,
                    userLimit: 1,
                    features: ['basic_crm', 'lead_management']
                },
                {
                    id: 'premium',
                    name: 'Premium Plan',
                    price: 99,
                    userLimit: 10,
                    features: ['advanced_analytics', 'custom_integrations', 'priority_support', 'api_access']
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise Plan',
                    price: 299,
                    userLimit: 100,
                    features: ['unlimited_users', 'advanced_security', 'custom_workflows', 'dedicated_support', 'white_label']
                }
            ];

            await SubscriptionPlan.insertMany(plans);
            console.log(`✅ Created ${plans.length} subscription plans`);
        } else {
            console.log(`✅ Found ${plansCount} existing subscription plans`);
        }

        // Ensure org-1 has enterprise plan
        const org1 = await Organization.findOne({ id: 'org-1' });
        if (org1) {
            if (org1.subscriptionPlanId !== 'enterprise') {
                console.log('🔄 Updating org-1 to enterprise plan...');
                await Organization.updateOne(
                    { id: 'org-1' },
                    {
                        subscriptionPlanId: 'enterprise',
                        subscriptionExpiresAt: new Date('2025-12-31'),
                        manuallyAssignedFeatures: ['advanced_analytics', 'custom_integrations', 'unlimited_users', 'advanced_security', 'custom_workflows', 'dedicated_support', 'white_label']
                    }
                );
                console.log('✅ Updated org-1 to enterprise plan');
            } else {
                console.log('✅ org-1 already has enterprise plan');
            }
        } else {
            console.log('⚠️ org-1 not found, will be created with enterprise plan when user logs in');
        }

        console.log('🎉 Subscription plans initialization completed!');
    } catch (error) {
        console.error('❌ Error initializing subscription plans:', error.message);
    }
};


