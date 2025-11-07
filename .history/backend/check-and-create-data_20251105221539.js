import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Lead from './models/Lead.js';

dotenv.config();

const checkAndCreateData = async () => {
    try {
        // Only run in development mode
        if (process.env.NODE_ENV === 'production') {
            console.log('🔧 Skipping sample data creation in production environment');
            return;
        }

        console.log('🔧 Checking and creating sample data...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Check if organizations exist, create if not
        let edTechOrg = await Organization.findOne({ id: 'org-1' });
        let realtyOrg = await Organization.findOne({ id: 'org-2' });

        if (!edTechOrg) {
            edTechOrg = await Organization.create({
                id: 'org-1',
                name: 'Ed-Tech Global',
                code: 'edtech-global',
                subscriptionPlanId: 'plan-1',
                subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                isEnabled: true,
                hasBlogAccess: true,
                logoUrl: 'https://i.pravatar.cc/150?u=edtech'
            });
            console.log('✅ Created Ed-Tech Global organization');
        } else {
            console.log('✅ Ed-Tech Global organization already exists');
        }

        if (!realtyOrg) {
            realtyOrg = await Organization.create({
                id: 'org-2',
                name: 'Realty Kings',
                code: 'realty-kings',
                subscriptionPlanId: 'plan-1',
                subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                isEnabled: true,
                hasBlogAccess: false,
                logoUrl: 'https://i.pravatar.cc/150?u=realty'
            });
            console.log('✅ Created Realty Kings organization');
        } else {
            console.log('✅ Realty Kings organization already exists');
        }

        // 2. Create sample users for each organization
        const edTechUserEmail = 'edtech.user@example.com';
        let edTechUser = await User.findOne({ email: edTechUserEmail });

        if (!edTechUser) {
            const nextUserId = Math.max(...(await User.find({}).select('id')).map(u => u.id), 0) + 1;
            edTechUser = await User.create({
                id: nextUserId,
                name: 'Ed-Tech Global User',
                email: edTechUserEmail,
                password: 'password123',
                avatar: `https://i.pravatar.cc/150?u=${nextUserId}`,
                phone: '+1234567891',
                role: 'Admin',
                teamId: 'team-edtech',
                permissions: ['view:all_leads', 'assign:leads', 'manage:users', 'manage:teams', 'manage:settings'],
                isTrackingEnabled: true,
                organizationId: 'org-1'
            });
            console.log('✅ Created Ed-Tech Global user');
        } else {
            console.log('✅ Ed-Tech Global user already exists');
        }

        // 3. Create sample leads for Ed-Tech Global
        const existingLeads = await Lead.find({ organizationId: 'org-1' });
        if (existingLeads.length === 0) {
            const sampleLeads = [
                {
                    id: 'lead-1',
                    name: 'John Smith',
                    email: 'john.smith@email.com',
                    phone: '+1234567890',
                    city: 'New York',
                    course: 'Business Development',
                    company: 'Tech Corp',
                    source: 'Website',
                    stage: 'new-lead',
                    followUpStatus: 'Pending',
                    score: 85,
                    tags: ['hot-lead', 'enterprise'],
                    assignedToId: edTechUser.id,
                    dealValue: 25000,
                    organizationId: 'org-1'
                },
                {
                    id: 'lead-2',
                    name: 'Sarah Johnson',
                    email: 'sarah.j@email.com',
                    phone: '+1234567891',
                    city: 'London',
                    course: 'Digital Marketing',
                    company: 'Marketing Pro',
                    source: 'Facebook',
                    stage: 'contacted',
                    followUpStatus: 'In Progress',
                    score: 72,
                    tags: ['warm-lead'],
                    assignedToId: edTechUser.id,
                    dealValue: 15000,
                    organizationId: 'org-1'
                },
                {
                    id: 'lead-3',
                    name: 'Mike Wilson',
                    email: 'mike.w@email.com',
                    phone: '+1234567892',
                    city: 'Toronto',
                    course: 'Data Science',
                    company: 'Data Inc',
                    source: 'LinkedIn',
                    stage: 'qualified',
                    followUpStatus: 'Qualified',
                    score: 91,
                    tags: ['hot-lead', 'enterprise'],
                    assignedToId: edTechUser.id,
                    dealValue: 35000,
                    organizationId: 'org-1'
                }
            ];

            await Lead.insertMany(sampleLeads);
            console.log(`✅ Created ${sampleLeads.length} sample leads for Ed-Tech Global`);
        } else {
            console.log(`✅ Found ${existingLeads.length} existing leads for Ed-Tech Global`);
        }

        // 4. Display summary
        const allOrgs = await Organization.find({});
        const allUsers = await User.find({});
        const allLeads = await Lead.find({});
        const edTechLeads = await Lead.find({ organizationId: 'org-1' });

        console.log('\n📊 Database Summary:');
        console.log(`   Organizations: ${allOrgs.length}`);
        allOrgs.forEach(org => console.log(`     - ${org.name} (${org.id})`));

        console.log(`   Users: ${allUsers.length}`);
        allUsers.forEach(user => console.log(`     - ${user.name} (${user.email}) - ${user.organizationId}`));

        console.log(`   Total Leads: ${allLeads.length}`);
        console.log(`   Ed-Tech Global Leads: ${edTechLeads.length}`);

        console.log('\n✅ Data check and creation completed successfully!');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    checkAndCreateData();
}

export { checkAndCreateData };


