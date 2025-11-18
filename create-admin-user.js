import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdminUser = async () => {
    try {
        console.log('🔧 Creating admin user...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create admin user with correct organization ID
        const adminUser = {
            id: 1,
            name: 'Admin User',
            email: 'admin@demo.com',
            password: 'password123',
            role: 'Admin',
            organizationId: 'org-1',
            avatar: 'https://via.placeholder.com/150',
            phone: '+1234567890',
            permissions: ['view:all_leads', 'manage:users', 'manage:settings'],
            isTrackingEnabled: false
        };

        console.log('👤 Creating admin user:', adminUser.email);

        // Check if user already exists
        const existingUser = await User.findOne({ email: adminUser.email });
        if (existingUser) {
            console.log('✅ Admin user already exists');
            await mongoose.disconnect();
            return;
        }

        const createdUser = await User.create(adminUser);
        console.log('✅ Admin user created successfully:', createdUser.name);

        // Check count
        const count = await User.countDocuments();
        console.log('👥 Total users:', count);

        await mongoose.disconnect();
        console.log('🎉 Admin user setup completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createAdminUser();


