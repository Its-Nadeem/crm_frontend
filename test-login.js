import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const testLogin = async () => {
    try {
        console.log('🔍 Testing login for admin@org1.com...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: 'admin@org1.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found:', user.email);
        console.log('Password hash exists:', !!user.password);

        const testPassword = 'Admin@123';
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`Password "${testPassword}" valid:`, isValid);

        await mongoose.disconnect();
        console.log('🔌 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testLogin();