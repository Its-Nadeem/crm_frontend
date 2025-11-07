import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Lead from './models/Lead.js';
import Stage from './models/Stage.js';
import Team from './models/Team.js';
import SubscriptionPlan from './models/SubscriptionPlan.js';

dotenv.config();

const ORG_ID = 'org-1';
const ORG_NAME = 'edtech global';

export const runEdtechSeeder = async () => {
    try {
        console.log('🔄 Starting edtech global seeder...');

        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Always ensure subscription plans exist first
        console.log('💳 Ensuring subscription plans exist...');
        const existingPlans = await SubscriptionPlan.find({});
        if (existingPlans.length === 0) {
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
            console.log(`✅ Found ${existingPlans.length} existing subscription plans`);
        }


        // Check if organization already exists
        const existingOrg = await Organization.findOne({ id: ORG_ID });
        if (existingOrg) {
            console.log('✅ Organization org-1 already exists, checking subscription plans...');

            // Ensure subscription plans exist even if organization exists
            const existingPlans = await SubscriptionPlan.find({});
            if (existingPlans.length === 0) {
                console.log('💳 No subscription plans found, creating them...');
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
            }

            // Update organization to enterprise plan if it's not already set
            if (existingOrg.subscriptionPlanId !== 'enterprise') {
                console.log('🔄 Updating org-1 to enterprise plan...');
                await Organization.updateOne(
                    { id: ORG_ID },
                    {
                        subscriptionPlanId: 'enterprise',
                        subscriptionExpiresAt: new Date('2025-12-31')
                    }
                );
                console.log('✅ Updated org-1 to enterprise plan');
            } else {
                console.log('✅ org-1 already has enterprise plan');
            }

            return;
        }

        // Clear existing data for org-1 only if organization doesn't exist
        console.log('🧹 Clearing existing data for org-1...');
        await Promise.all([
            Organization.deleteMany({ id: ORG_ID }),
            User.deleteMany({ organizationId: ORG_ID }),
            Lead.deleteMany({ organizationId: ORG_ID }),
            Stage.deleteMany({ organizationId: ORG_ID }),
            Team.deleteMany({ organizationId: ORG_ID })
        ]);

        // 1. Create Organization
        console.log('🏢 Creating edtech global organization...');
        const organization = await Organization.create({
            id: ORG_ID,
            name: ORG_NAME,
            code: 'EDTECH001',
            apiKey: 'edtech_global_api_key_2024',
            isEnabled: true,
            subscriptionPlanId: 'enterprise',
            subscriptionExpiresAt: new Date('2025-12-31'),
            logoUrl: 'https://example.com/edtech-logo.png',
            themeColor: '#2563eb',
            hasBlogAccess: true,
            manuallyAssignedFeatures: ['advanced_analytics', 'custom_integrations']
        });

        // 2. Create Teams
        console.log('👥 Creating teams...');
        const teams = await Promise.all([
            Team.create({
                id: 'team-1',
                name: 'Sales Team',
                leadId: 1002, // Priya Sharma (Sales Manager)
                memberIds: [1003, 1004], // Amit and Sneha (Sales Reps)
                organizationId: ORG_ID
            }),
            Team.create({
                id: 'team-2',
                name: 'Marketing Team',
                leadId: 1005, // Vikram Singh (Marketing Manager)
                memberIds: [], // No additional members for now
                organizationId: ORG_ID
            }),
            Team.create({
                id: 'team-3',
                name: 'Support Team',
                leadId: 1001, // Rajesh Kumar (Admin)
                memberIds: [], // No additional members for now
                organizationId: ORG_ID
            })
        ]);

        // 3. Create Users
        console.log('👤 Creating users...');
        const users = await Promise.all([
            // Admin
            User.create({
                id: 1001,
                name: 'Rajesh Kumar',
                email: 'rajesh@edtechglobal.com',
                password: 'password123',
                avatar: 'https://example.com/avatars/rajesh.jpg',
                phone: '+91-9876543210',
                role: 'Admin',
                teamId: 'team-1',
                permissions: ['all'],
                isTrackingEnabled: true,
                organizationId: ORG_ID,
                superAdminRole: null
            }),
            // Sales Manager
            User.create({
                id: 1002,
                name: 'Priya Sharma',
                email: 'priya@edtechglobal.com',
                password: 'password123',
                avatar: 'https://example.com/avatars/priya.jpg',
                phone: '+91-9876543211',
                role: 'Manager',
                teamId: 'team-1',
                permissions: ['manage_leads', 'view_reports', 'manage_team'],
                isTrackingEnabled: true,
                organizationId: ORG_ID,
                superAdminRole: null
            }),
            // Sales Rep 1
            User.create({
                id: 1003,
                name: 'Amit Patel',
                email: 'amit@edtechglobal.com',
                password: 'password123',
                avatar: 'https://example.com/avatars/amit.jpg',
                phone: '+91-9876543212',
                role: 'Sales Rep',
                teamId: 'team-1',
                permissions: ['create_leads', 'edit_own_leads', 'view_own_reports'],
                isTrackingEnabled: true,
                organizationId: ORG_ID,
                superAdminRole: null
            }),
            // Sales Rep 2
            User.create({
                id: 1004,
                name: 'Sneha Reddy',
                email: 'sneha@edtechglobal.com',
                password: 'password123',
                avatar: 'https://example.com/avatars/sneha.jpg',
                phone: '+91-9876543213',
                role: 'Sales Rep',
                teamId: 'team-1',
                permissions: ['create_leads', 'edit_own_leads', 'view_own_reports'],
                isTrackingEnabled: true,
                organizationId: ORG_ID,
                superAdminRole: null
            }),
            // Marketing Manager
            User.create({
                id: 1005,
                name: 'Vikram Singh',
                email: 'vikram@edtechglobal.com',
                password: 'password123',
                avatar: 'https://example.com/avatars/vikram.jpg',
                phone: '+91-9876543214',
                role: 'Manager',
                teamId: 'team-2',
                permissions: ['manage_campaigns', 'view_analytics', 'manage_integrations'],
                isTrackingEnabled: true,
                organizationId: ORG_ID,
                superAdminRole: null
            })
        ]);

        // 4. Create Stages
        console.log('📊 Creating pipeline stages...');
        const stages = await Promise.all([
            Stage.create({
                id: 'stage-1',
                name: 'New Lead',
                description: 'Fresh leads that need qualification',
                organizationId: ORG_ID,
                order: 1,
                color: '#3b82f6',
                isActive: true
            }),
            Stage.create({
                id: 'stage-2',
                name: 'Qualified',
                description: 'Leads that have been qualified',
                organizationId: ORG_ID,
                order: 2,
                color: '#f59e0b',
                isActive: true
            }),
            Stage.create({
                id: 'stage-3',
                name: 'Proposal Sent',
                description: 'Proposal has been sent to the lead',
                organizationId: ORG_ID,
                order: 3,
                color: '#8b5cf6',
                isActive: true
            }),
            Stage.create({
                id: 'stage-4',
                name: 'Negotiation',
                description: 'In negotiation phase',
                organizationId: ORG_ID,
                order: 4,
                color: '#f97316',
                isActive: true
            }),
            Stage.create({
                id: 'stage-5',
                name: 'Closed Won',
                description: 'Successfully closed deals',
                organizationId: ORG_ID,
                order: 5,
                color: '#10b981',
                isActive: true
            }),
            Stage.create({
                id: 'stage-6',
                name: 'Closed Lost',
                description: 'Lost opportunities',
                organizationId: ORG_ID,
                order: 6,
                color: '#ef4444',
                isActive: true
            })
        ]);

        // 5. Create Leads with comprehensive mock data
        console.log('🎯 Creating leads with mock data...');
        const courses = [
            'Data Science Bootcamp',
            'Full Stack Web Development',
            'Digital Marketing Course',
            'Machine Learning Specialization',
            'Cloud Computing Certification',
            'Cybersecurity Fundamentals',
            'UI/UX Design Course',
            'Mobile App Development',
            'DevOps Engineering',
            'Business Analytics'
        ];

        const sources = ['Website', 'Facebook', 'Google Ads', 'Referral', 'LinkedIn', 'WhatsApp', 'Email Campaign'];
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];

        const leadsData = [
            // Closed Won Leads (25% of total)
            {
                id: 'lead-001',
                name: 'Arjun Mehta',
                email: 'arjun.mehta@email.com',
                phone: '+91-9876543215',
                city: 'Mumbai',
                course: 'Data Science Bootcamp',
                source: 'Website',
                stage: 'Closed Won',
                dealValue: 75000,
                closeDate: new Date('2024-09-15'),
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Initial consultation call completed',
                        timestamp: new Date('2024-09-01'),
                        authorId: 3
                    },
                    {
                        type: 'email',
                        content: 'Sent course brochure and pricing details',
                        timestamp: new Date('2024-09-05'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-002',
                name: 'Kavita Singh',
                email: 'kavita.singh@email.com',
                phone: '+91-9876543216',
                city: 'Delhi',
                course: 'Full Stack Web Development',
                source: 'Facebook',
                stage: 'Closed Won',
                dealValue: 85000,
                closeDate: new Date('2024-09-20'),
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'meeting',
                        content: 'Demo session completed successfully',
                        timestamp: new Date('2024-09-10'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-003',
                name: 'Rohit Sharma',
                email: 'rohit.sharma@email.com',
                phone: '+91-9876543217',
                city: 'Bangalore',
                course: 'Machine Learning Specialization',
                source: 'Google Ads',
                stage: 'Closed Won',
                dealValue: 95000,
                closeDate: new Date('2024-09-25'),
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Technical discussion completed',
                        timestamp: new Date('2024-09-12'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-004',
                name: 'Anjali Patel',
                email: 'anjali.patel@email.com',
                phone: '+91-9876543218',
                city: 'Hyderabad',
                course: 'Digital Marketing Course',
                source: 'Referral',
                stage: 'Closed Won',
                dealValue: 65000,
                closeDate: new Date('2024-09-28'),
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Follow-up email sent with success stories',
                        timestamp: new Date('2024-09-18'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-005',
                name: 'Vijay Kumar',
                email: 'vijay.kumar@email.com',
                phone: '+91-9876543219',
                city: 'Pune',
                course: 'Cloud Computing Certification',
                source: 'LinkedIn',
                stage: 'Closed Won',
                dealValue: 80000,
                closeDate: new Date('2024-10-01'),
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Pricing negotiation completed',
                        timestamp: new Date('2024-09-22'),
                        authorId: 3
                    }
                ]
            },

            // Negotiation Stage (15% of total)
            {
                id: 'lead-006',
                name: 'Priya Desai',
                email: 'priya.desai@email.com',
                phone: '+91-9876543220',
                city: 'Mumbai',
                course: 'Cybersecurity Fundamentals',
                source: 'Website',
                stage: 'Negotiation',
                dealValue: 70000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'meeting',
                        content: 'Proposal presentation completed',
                        timestamp: new Date('2024-09-25'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-007',
                name: 'Suresh Reddy',
                email: 'suresh.reddy@email.com',
                phone: '+91-9876543221',
                city: 'Chennai',
                course: 'UI/UX Design Course',
                source: 'Facebook',
                stage: 'Negotiation',
                dealValue: 60000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Contract terms discussion',
                        timestamp: new Date('2024-09-28'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-008',
                name: 'Meera Iyer',
                email: 'meera.iyer@email.com',
                phone: '+91-9876543222',
                city: 'Bangalore',
                course: 'Mobile App Development',
                source: 'Google Ads',
                stage: 'Negotiation',
                dealValue: 90000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Final proposal with discount sent',
                        timestamp: new Date('2024-10-01'),
                        authorId: 4
                    }
                ]
            },

            // Proposal Sent Stage (20% of total)
            {
                id: 'lead-009',
                name: 'Rajiv Gupta',
                email: 'rajiv.gupta@email.com',
                phone: '+91-9876543223',
                city: 'Delhi',
                course: 'DevOps Engineering',
                source: 'Referral',
                stage: 'Proposal Sent',
                dealValue: 85000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Detailed proposal sent',
                        timestamp: new Date('2024-09-30'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-010',
                name: 'Swati Jain',
                email: 'swati.jain@email.com',
                phone: '+91-9876543224',
                city: 'Kolkata',
                course: 'Business Analytics',
                source: 'LinkedIn',
                stage: 'Proposal Sent',
                dealValue: 75000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Proposal walkthrough scheduled',
                        timestamp: new Date('2024-10-02'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-011',
                name: 'Amit Kumar',
                email: 'amit.kumar@email.com',
                phone: '+91-9876543225',
                city: 'Ahmedabad',
                course: 'Data Science Bootcamp',
                source: 'WhatsApp',
                stage: 'Proposal Sent',
                dealValue: 80000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'meeting',
                        content: 'Virtual meeting for proposal discussion',
                        timestamp: new Date('2024-10-03'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-012',
                name: 'Neha Sharma',
                email: 'neha.sharma@email.com',
                phone: '+91-9876543226',
                city: 'Pune',
                course: 'Full Stack Web Development',
                source: 'Email Campaign',
                stage: 'Proposal Sent',
                dealValue: 70000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Customized proposal based on requirements',
                        timestamp: new Date('2024-10-04'),
                        authorId: 4
                    }
                ]
            },

            // Qualified Stage (25% of total)
            {
                id: 'lead-013',
                name: 'Siddharth Roy',
                email: 'siddharth.roy@email.com',
                phone: '+91-9876543227',
                city: 'Mumbai',
                course: 'Machine Learning Specialization',
                source: 'Website',
                stage: 'Qualified',
                dealValue: 95000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Initial qualification call completed',
                        timestamp: new Date('2024-10-05'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-014',
                name: 'Pooja Mehta',
                email: 'pooja.mehta@email.com',
                phone: '+91-9876543228',
                city: 'Delhi',
                course: 'Digital Marketing Course',
                source: 'Facebook',
                stage: 'Qualified',
                dealValue: 65000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'meeting',
                        content: 'Requirements gathering session',
                        timestamp: new Date('2024-10-06'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-015',
                name: 'Ravi Shankar',
                email: 'ravi.shankar@email.com',
                phone: '+91-9876543229',
                city: 'Bangalore',
                course: 'Cloud Computing Certification',
                source: 'Google Ads',
                stage: 'Qualified',
                dealValue: 80000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Technical qualification completed',
                        timestamp: new Date('2024-10-07'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-016',
                name: 'Divya Singh',
                email: 'divya.singh@email.com',
                phone: '+91-9876543230',
                city: 'Hyderabad',
                course: 'Cybersecurity Fundamentals',
                source: 'Referral',
                stage: 'Qualified',
                dealValue: 75000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'Budget and timeline discussion',
                        timestamp: new Date('2024-10-08'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-017',
                name: 'Arun Kumar',
                email: 'arun.kumar@email.com',
                phone: '+91-9876543231',
                city: 'Chennai',
                course: 'UI/UX Design Course',
                source: 'LinkedIn',
                stage: 'Qualified',
                dealValue: 70000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'meeting',
                        content: 'Portfolio review and capability discussion',
                        timestamp: new Date('2024-10-09'),
                        authorId: 3
                    }
                ]
            },

            // New Lead Stage (15% of total)
            {
                id: 'lead-018',
                name: 'Kiran Patel',
                email: 'kiran.patel@email.com',
                phone: '+91-9876543232',
                city: 'Mumbai',
                course: 'Mobile App Development',
                source: 'Website',
                stage: 'New Lead',
                dealValue: 85000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Welcome email sent - initial outreach',
                        timestamp: new Date('2024-10-10'),
                        authorId: 4
                    }
                ]
            },
            {
                id: 'lead-019',
                name: 'Sunita Devi',
                email: 'sunita.devi@email.com',
                phone: '+91-9876543233',
                city: 'Delhi',
                course: 'DevOps Engineering',
                source: 'WhatsApp',
                stage: 'New Lead',
                dealValue: 90000,
                assignedToId: 3,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'call',
                        content: 'First contact attempt made',
                        timestamp: new Date('2024-10-11'),
                        authorId: 3
                    }
                ]
            },
            {
                id: 'lead-020',
                name: 'Manoj Tiwari',
                email: 'manoj.tiwari@email.com',
                phone: '+91-9876543234',
                city: 'Bangalore',
                course: 'Business Analytics',
                source: 'Email Campaign',
                stage: 'New Lead',
                dealValue: 75000,
                assignedToId: 4,
                organizationId: ORG_ID,
                activities: [
                    {
                        type: 'email',
                        content: 'Introductory email with course info',
                        timestamp: new Date('2024-10-12'),
                        authorId: 4
                    }
                ]
            }
        ];

        // Create all leads
        const leads = await Lead.insertMany(leadsData);

        // Update todo status
        console.log('✅ Edtech global seeder completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   Organization: ${organization.name} (${organization.id})`);
        console.log(`   Teams: ${teams.length} created`);
        console.log(`   Users: ${users.length} created`);
        console.log(`   Stages: ${stages.length} created`);
        console.log(`   Leads: ${leads.length} created`);

        // Calculate and display pipeline metrics
        const totalLeads = leads.length;
        const closedWonLeads = leads.filter(lead => lead.stage === 'Closed Won').length;
        const totalPipelineValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
        const closedWonValue = leads.filter(lead => lead.stage === 'Closed Won').reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
        const conversionRate = totalLeads > 0 ? ((closedWonLeads / totalLeads) * 100).toFixed(1) : 0;

        console.log(`🎯 Pipeline Metrics:`);
        console.log(`   Total Leads: ${totalLeads}`);
        console.log(`   Closed Won: ${closedWonLeads} (${conversionRate}%)`);
        console.log(`   Total Pipeline Value: ₹${totalPipelineValue.toLocaleString('en-IN')}`);
        console.log(`   Closed Won Value: ₹${closedWonValue.toLocaleString('en-IN')}`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during edtech seeder:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runEdtechSeeder();
}


