import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './models/Organization.js';
import User from './models/User.js';
import Lead from './models/Lead.js';
import Stage from './models/Stage.js';

dotenv.config();

const fixStagesAndLeads = async () => {
    try {
        console.log('🔧 Starting stage and lead data fix...');

        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define the correct stage structure
        const stageDefinitions = [
            { id: 'stage-1', name: 'New Lead', color: '#3b82f6', order: 1 },
            { id: 'stage-2', name: 'Qualified', color: '#f59e0b', order: 2 },
            { id: 'stage-3', name: 'Proposal Sent', color: '#8b5cf6', order: 3 },
            { id: 'stage-4', name: 'Negotiation', color: '#f97316', order: 4 },
            { id: 'stage-5', name: 'Closed Won', color: '#10b981', order: 5 },
            { id: 'stage-6', name: 'Closed Lost', color: '#ef4444', order: 6 }
        ];

        // Fix data for org-1
        console.log('📊 Fixing data for org-1...');
        await fixOrganizationStages('org-1', stageDefinitions);

        // Fix data for org-2
        console.log('📊 Fixing data for org-2...');
        await fixOrganizationStages('org-2', stageDefinitions);

        console.log('✅ Stage and lead data fix completed successfully!');
        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during stage and lead fix:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

const fixOrganizationStages = async (orgId, stageDefinitions) => {
    // 1. Delete existing stages for this organization
    await Stage.deleteMany({ organizationId: orgId });
    console.log(`🗑️  Deleted existing stages for ${orgId}`);

    // 2. Create correct stages for this organization
    const stages = await Promise.all(
        stageDefinitions.map(stageDef =>
            Stage.create({
                ...stageDef,
                organizationId: orgId,
                description: `${stageDef.name} stage`,
                isActive: true
            })
        )
    );
    console.log(`✅ Created ${stages.length} stages for ${orgId}`);

    // 3. Create stage name to ID mapping
    const stageNameToId = {};
    stages.forEach(stage => {
        stageNameToId[stage.name] = stage.id;
    });

    // 4. Update leads to use stage IDs instead of stage names
    const leads = await Lead.find({ organizationId: orgId });

    for (const lead of leads) {
        const currentStageName = lead.stage;
        const correctStageId = stageNameToId[currentStageName];

        if (correctStageId && correctStageId !== currentStageName) {
            lead.stage = correctStageId;
            await lead.save();
            console.log(`🔄 Updated lead ${lead.id}: "${currentStageName}" -> "${correctStageId}"`);
        }
    }

    console.log(`✅ Updated ${leads.length} leads for ${orgId}`);
};

// Run the fix if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    fixStagesAndLeads();
}

export { fixStagesAndLeads };


