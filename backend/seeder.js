import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const runSeeder = async () => {
    try {
        // Only run in development mode
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Skipping seeder in production environment');
            return;
        }

        console.log('🔄 Checking database connection...');

        // Check if database is accessible
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`✅ Database connected successfully. Found ${collections.length} collections.`);

        // Only create essential system data if needed
        const userCount = await mongoose.connection.db.collection('users').countDocuments();

        if (userCount === 0) {
            console.log('⚠️  No users found in database. Please create initial users through the application.');
        } else {
            console.log(`✅ Found ${userCount} existing users in database.`);
        }

        console.log('🎉 Database check completed successfully!');
    } catch (error) {
        console.error(`Error with database check: ${error}`);
        process.exit(1);
    }
};



