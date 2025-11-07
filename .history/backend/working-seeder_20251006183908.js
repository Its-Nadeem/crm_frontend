import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const runSeeder = async () => {
    try {
        console.log('🔄 Checking database connection...');

        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check existing data
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Database status:`);
        console.log(`   Collections: ${collections.length}`);

        for (const collection of collections) {
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            console.log(`   ${collection.name}: ${count} documents`);
        }

        console.log('✅ Database check completed successfully!');
        console.log('ℹ️  No mock data seeding performed. Database ready for live data.');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during database check:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSeeder();
}


