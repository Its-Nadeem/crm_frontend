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

        // Ensure org-1 has enterprise plan (only if it doesn't already have it)
        const org1 = await Organization.findOne({ id: 'org-1' });
        if (org1) {
            // Only update if org-1 doesn't already have enterprise plan
            if (org1.subscriptionPlanId !== 'enterprise') {
                console.log('🔄 Ensuring org-1 has enterprise plan...');
                console.log('Current org-1 plan:', org1.subscriptionPlanId, 'Expires:', org1.subscriptionExpiresAt);

                const updateResult = await Organization.updateOne(
                    { id: 'org-1' },
                    {
                        subscriptionPlanId: 'enterprise',
                        subscriptionExpiresAt: new Date('2025-12-31'),
                        manuallyAssignedFeatures: ['advanced_analytics', 'custom_integrations', 'unlimited_users', 'advanced_security', 'custom_workflows', 'dedicated_support', 'white_label']
                    }
                );
                console.log(`✅ Ensured org-1 has enterprise plan (${updateResult.modifiedCount} document(s) updated)`);

                // Verify the update
                const updatedOrg = await Organization.findOne({ id: 'org-1' });
                console.log('Updated org-1 plan:', updatedOrg?.subscriptionPlanId, 'Expires:', updatedOrg?.subscriptionExpiresAt);
            } else {
                console.log('✅ org-1 already has enterprise plan, no update needed');
            }
        } else {
            console.log('⚠️ org-1 not found, will be created with enterprise plan when user logs in');
        }

        console.log('🎉 Subscription plans initialization completed!');
    } catch (error) {
        console.error('❌ Error initializing subscription plans:', error.message);
    }
};


