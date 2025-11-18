import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const checkPassword = async () => {
    try {
        console.log('🔍 Checking user password...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: 'Nadeemjabir1@gmail.com' });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('👤 User found:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔐 Password hash length:', user.password.length);

        // Test the password you provided
        const testPassword = 'Nadeem@0331';
        const isValid = await bcrypt.compare(testPassword, user.password);

        console.log('🔍 Testing password:', testPassword);
        console.log('🔍 Password valid:', isValid ? '✅ YES' : '❌ NO');

        if (!isValid) {
            console.log('❌ Password does not match stored hash');
            console.log('🔄 Re-hashing password...');

            // Re-hash the password
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(testPassword, salt);

            // Update in database
            await User.updateOne(
                { email: 'Nadeemjabir1@gmail.com' },
                { $set: { password: newHash } }
            );

            console.log('✅ Password re-hashed and updated');

            // Test again
            const updatedUser = await User.findOne({ email: 'Nadeemjabir1@gmail.com' });
            const retest = await bcrypt.compare(testPassword, updatedUser.password);
            console.log('🔍 Re-test result:', retest ? '✅ VALID' : '❌ INVALID');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkPassword();


