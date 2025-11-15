import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import Lead from './models/Lead.js';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

// Facebook leads data provided by user
const FACEBOOK_LEADS_DATA = `id	created_time	ad_id	ad_name	adset_id	adset_name	campaign_id	campaign_name	form_id	form_name	is_organic	platform	full_name	phone_number	work_email	city	inbox_url	lead_status
l:4280180252203503	2025-09-12T15:05:13+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Akshay Sinha	p:+447879433123	Aks@blupacetech.com	London		complete
l:582128261560337	2025-09-12T13:57:00+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Chimzurum Onyeoma	p:07405263058	Chimzurum.Onyeoma@zimidentity.net	London		complete
l:826623086464697	2025-09-12T02:30:58+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Abdellah Amgour	p:+447432147687	amgour.27@gmail.com	London		complete
l:1831597447492704	2025-09-12T02:06:09+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Syed Sher	p:+447510551555	Burhansher@hotmail.co.uk	London		complete
l:3780192782279149	2025-09-12T00:46:15+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Greg Downing	p:+447856423027	gdowning@gmail.com	Milton Keynes		complete
l:1290301695919689	2025-09-11T18:18:58+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	fb	Rob Stansfield	p:+447540260505	Rob@uniquespecialistservices.com	Manchester	https://business.facebook.com	complete`;

const addFacebookLeads = async () => {
    try {
        console.log('📱 Processing Facebook leads data...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Parse the Facebook leads data
        const lines = FACEBOOK_LEADS_DATA.trim().split('\n');
        const headers = lines[0].split('\t');

        console.log(`📋 Found ${lines.length - 1} leads to process`);

        // Get existing users for assignment
        const edTechUsers = await User.find({ organizationId: 'org-1', role: { $in: ['Admin', 'Manager', 'Sales Rep'] } });
        const realtyUsers = await User.find({ organizationId: 'org-2', role: { $in: ['Admin', 'Manager', 'Sales Rep'] } });

        if (edTechUsers.length === 0 || realtyUsers.length === 0) {
            console.log('❌ No users found for organizations. Please run add-organization-users.js first.');
            return;
        }

        const leadsToInsert = [];
        const leadId = 1000; // Starting ID for new leads

        // Process each lead (skip header row)
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('\t');
            const leadData = {};

            // Map values to headers
            headers.forEach((header, index) => {
                leadData[header] = values[index] || '';
            });

            // Clean phone number (remove 'p:' prefix)
            const cleanPhone = leadData.phone_number.replace('p:', '').replace(/^\+/, '');

            // Determine organization (alternate between org-1 and org-2)
            const organizationId = (i % 2 === 0) ? 'org-1' : 'org-2';
            const assignedUsers = organizationId === 'org-1' ? edTechUsers : realtyUsers;
            const assignedTo = faker.helpers.arrayElement(assignedUsers);

            // Create lead object
            const lead = {
                id: `fb_${leadId + i}`,
                name: leadData.full_name,
                email: leadData.work_email,
                phone: cleanPhone,
                alternatePhone: '',
                city: leadData.city,
                course: organizationId === 'org-1' ? 'International Business Development' : 'Real Estate Management',
                company: leadData.work_email ? leadData.work_email.split('@')[1] : 'Unknown Company',
                source: leadData.platform === 'fb' ? 'Facebook' : 'Instagram',
                stage: 'new-lead',
                followUpStatus: 'Pending',
                score: faker.number.int({ min: 20, max: 100 }),
                tags: ['facebook-lead', 'imported', leadData.platform],
                assignedToId: assignedTo.id,
                createdAt: new Date(leadData.created_time).toISOString(),
                updatedAt: new Date().toISOString(),
                dealValue: faker.number.int({ min: 1000, max: 50000 }),
                closeDate: faker.date.soon({ days: 90 }).toISOString(),
                activities: [{
                    id: faker.string.uuid(),
                    type: 'LEAD_CREATED',
                    content: `Lead created from ${leadData.platform === 'fb' ? 'Facebook' : 'Instagram'} ad: ${leadData.ad_name}`,
                    timestamp: new Date(leadData.created_time).toISOString(),
                    authorId: assignedTo.id
                }],
                scheduledMessages: [],
                campaign: leadData.campaign_name,
                facebookCampaign: leadData.campaign_name,
                facebookAdset: leadData.adset_name,
                facebookAd: leadData.ad_name,
                customFields: {},
                organizationId: organizationId,
                leadStatus: leadData.lead_status,
                platform: leadData.platform,
                isOrganic: leadData.is_organic === 'TRUE'
            };

            leadsToInsert.push(lead);
        }

        // Insert leads in batches
        console.log(`💾 Inserting ${leadsToInsert.length} leads into database...`);

        if (leadsToInsert.length > 0) {
            await Lead.insertMany(leadsToInsert);
            console.log(`✅ Successfully inserted ${leadsToInsert.length} Facebook leads`);
        }

        // Display summary
        const edTechLeads = leadsToInsert.filter(lead => lead.organizationId === 'org-1').length;
        const realtyLeads = leadsToInsert.filter(lead => lead.organizationId === 'org-2').length;

        console.log('\n📊 Lead Distribution Summary:');
        console.log(`   Ed-Tech Global (org-1): ${edTechLeads} leads`);
        console.log(`   Realty Kings (org-2): ${realtyLeads} leads`);

        console.log('\n📋 Sample Lead Data (first 2 leads):');
        leadsToInsert.slice(0, 2).forEach((lead, index) => {
            console.log(`   ${index + 1}. ${lead.name} - ${lead.phone} - ${lead.email} - ${lead.city} (${lead.organizationId})`);
        });

        console.log('\n✅ Facebook leads processing completed successfully!');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error processing Facebook leads:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addFacebookLeads();
}

export { addFacebookLeads };


