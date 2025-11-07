import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const debugSeeder = async () => {
    try {
        // Only run in development mode
        if (process.env.NODE_ENV === 'production') {
            console.log('🔧 Skipping debug seeder in production environment');
            return;
        }

        console.log('🔧 Debug: Testing database connection...');

        // Test basic connection
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test if we can access the database
        const db = mongoose.connection.db;
        console.log('📊 Database name:', db.databaseName);

        // Test collections
        const collections = await db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections`);

        // Test User model
        console.log('👤 Testing User model...');
        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
            password: String
        });
        const User = mongoose.model('User', UserSchema);

        const userCount = await User.countDocuments();
        console.log(`👥 Users in database: ${userCount}`);

        // If no users, try to insert one test user
        if (userCount === 0) {
            console.log('🆕 No users found, inserting test user...');
            const testUser = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'test123'
            });
            await testUser.save();
            console.log('✅ Test user inserted');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

debugSeeder();


