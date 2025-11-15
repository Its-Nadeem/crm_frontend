import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Lead from './models/Lead.js';
import Stage from './models/Stage.js';

dotenv.config();

const testDataConsistency = async () => {
    try {
        console.log('🧪 Testing data consistency fixes...');

        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test org-1
        console.log('\n📊 Testing org-1...');
        await testOrganization('org-1');

        // Test org-2
        console.log('\n📊 Testing org-2...');
        await testOrganization('org-2');

        console.log('\n✅ Data consistency test completed successfully!');
        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during data consistency test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

const testOrganization = async (orgId) => {
    // 1. Check if stages exist
    const stages = await Stage.find({ organizationId: orgId });
    console.log(`📋 Stages found: ${stages.length}`);

    if (stages.length === 0) {
        console.error(`❌ No stages found for ${orgId}`);
        return;
    }

    // 2. Check stage structure
    const expectedStageIds = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6'];
    const foundStageIds = stages.map(s => s.id);

    console.log(`🎯 Expected stage IDs: ${expectedStageIds.join(', ')}`);
    console.log(`📍 Found stage IDs: ${foundStageIds.join(', ')}`);

    const missingStages = expectedStageIds.filter(id => !foundStageIds.includes(id));
    if (missingStages.length > 0) {
        console.error(`❌ Missing stages: ${missingStages.join(', ')}`);
    } else {
        console.log(`✅ All expected stages are present`);
    }

    // 3. Check leads
    const leads = await Lead.find({ organizationId: orgId });
    console.log(`👥 Leads found: ${leads.length}`);

    // 4. Check if leads use stage IDs (not names)
    const leadsWithStageNames = leads.filter(lead => {
        // Check if stage field contains a name instead of an ID
        const stageNames = stages.map(s => s.name);
        return stageNames.includes(lead.stage);
    });

    const leadsWithStageIds = leads.filter(lead => {
        // Check if stage field contains an ID
        return expectedStageIds.includes(lead.stage);
    });

    console.log(`🔄 Leads using stage names: ${leadsWithStageNames.length}`);
    console.log(`🎯 Leads using stage IDs: ${leadsWithStageIds.length}`);

    if (leadsWithStageNames.length > 0) {
        console.error(`❌ Found ${leadsWithStageNames.length} leads still using stage names instead of IDs`);
        leadsWithStageNames.forEach(lead => {
            console.error(`   Lead ${lead.id}: "${lead.stage}" should be a stage ID`);
        });
    } else {
        console.log(`✅ All leads are using stage IDs correctly`);
    }

    // 5. Test API endpoint simulation (populate check)
    console.log(`🔍 Testing data population for ${leads.length} leads...`);

    for (const lead of leads.slice(0, 3)) { // Test first 3 leads
        const populatedLead = await Lead.findOne({ id: lead.id }).populate('assignedToId', 'name email');

        if (populatedLead.assignedToId && typeof populatedLead.assignedToId === 'object') {
            console.log(`✅ Lead ${lead.id} - Owner populated: ${populatedLead.assignedToId.name}`);
        } else {
            console.log(`⚠️  Lead ${lead.id} - Owner not populated or missing`);
        }

        // Check if stage ID exists in stages collection
        const stageExists = stages.some(s => s.id === lead.stage);
        if (stageExists) {
            console.log(`✅ Lead ${lead.id} - Stage ID exists: ${lead.stage}`);
        } else {
            console.log(`❌ Lead ${lead.id} - Stage ID not found: ${lead.stage}`);
        }
    }

    // 6. Summary
    console.log(`\n📈 Summary for ${orgId}:`);
    console.log(`   Stages: ${stages.length}/6 ✅`);
    console.log(`   Leads: ${leads.length} total`);
    console.log(`   Leads with correct stage IDs: ${leadsWithStageIds.length}/${leads.length} ✅`);
    console.log(`   Data consistency: ${leadsWithStageNames.length === 0 ? '✅' : '❌'}`);
};

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testDataConsistency();
}

export { testDataConsistency };


