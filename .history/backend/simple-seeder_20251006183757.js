import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const simpleSeeder = async () => {
    try {
        console.log('🔧 Simple seeder: Checking database connection...');

        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI environment variable is not set');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check existing data
        const orgCount = await mongoose.connection.db.collection('organizations').countDocuments();
        const userCount = await mongoose.connection.db.collection('users').countDocuments();

        console.log(`📊 Database status:`);
        console.log(`   Organizations: ${orgCount}`);
        console.log(`   Users: ${userCount}`);

        if (orgCount === 0 && userCount === 0) {
            console.log('⚠️  No data found in database. Please create initial data through the application API.');
        } else {
            console.log('✅ Database contains existing data.');
        }

        console.log('🎉 Database check completed successfully!');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

simpleSeeder();


