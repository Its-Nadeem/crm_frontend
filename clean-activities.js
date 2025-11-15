import Lead from './models/Lead.js';
import mongoose from 'mongoose';

const cleanProblematicActivities = async () => {
    try {
        console.log('Starting cleanup of problematic activities...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb');
        console.log('Connected to MongoDB');

        // Find all leads
        const leads = await Lead.find({});
        let totalCleaned = 0;

        for (const lead of leads) {
            if (lead.activities && lead.activities.length > 0) {
                // Filter out problematic activities
                const cleanActivities = lead.activities.filter(activity => {
                    // Remove activities with MongoDB internal fields
                    if (activity.content.includes('$__') ||
                        activity.content.includes('new ObjectId') ||
                        activity.content.includes('[object Object]') ||
                        activity.content.includes('[object Map]') ||
                        activity.content.includes('ObjectId(') ||
                        activity.content.includes('_id: new ObjectId')) {
                        return false;
                    }

                    // Remove activities that are too long (likely contain verbose dumps)
                    if (activity.content.length > 500) {
                        return false;
                    }

                    // Keep legitimate activities
                    return true;
                });

                // Update lead if activities were removed
                if (cleanActivities.length !== lead.activities.length) {
                    lead.activities = cleanActivities;
                    await lead.save();
                    const removedCount = lead.activities.length - cleanActivities.length;
                    totalCleaned += removedCount;
                    console.log(`Cleaned ${removedCount} activities from lead: ${lead.id}`);
                }
            }
        }

        console.log(`✅ Cleanup completed! Removed ${totalCleaned} problematic activities from ${leads.length} leads`);

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

// Run the cleanup
cleanProblematicActivities();


