import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ORGANIZATIONS, USERS } from './comprehensive-data.js';
import Organization from './models/Organization.js';
import User from './models/User.js';

dotenv.config();

const simpleSeeder = async () => {
    try {
        console.log('🔧 Simple seeder: Testing with just organizations and users...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Organization.deleteMany({});
        await User.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Insert organizations
        console.log('📝 Inserting organizations...');
        const createdOrgs = await Organization.insertMany(ORGANIZATIONS);
        console.log(`✅ Inserted ${createdOrgs.length} organizations`);

        // Insert users
        console.log('👥 Inserting users...');
        const createdUsers = await User.insertMany(USERS);
        console.log(`✅ Inserted ${createdUsers.length} users`);

        console.log('🎉 Simple seeding completed successfully!');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

simpleSeeder();


