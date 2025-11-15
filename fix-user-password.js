import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const fixUserPassword = async () => {
    try {
        console.log('🔧 Fixing user password...');

        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find the super admin user
        const user = await User.findOne({ email: 'Nadeemjabir1@gmail.com' });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('👤 User found:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔐 Hashed password length:', user.password.length);

        // Hash the correct password
        const correctPassword = 'Nadeem@0331';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(correctPassword, salt);

        console.log('🔄 Updating password hash...');
        console.log('New hash length:', hashedPassword.length);

        // Update the user's password directly in the database
        await User.updateOne(
            { email: 'Nadeemjabir1@gmail.com' },
            { $set: { password: hashedPassword } }
        );

        console.log('✅ Password updated successfully!');

        // Fetch the updated user and test
        const updatedUser = await User.findOne({ email: 'Nadeemjabir1@gmail.com' });
        const isValid = await bcrypt.compare(correctPassword, updatedUser.password);
        console.log('🔍 Password test result:', isValid ? '✅ VALID' : '❌ INVALID');

        if (isValid) {
            console.log('🎉 Login should work now!');
        } else {
            console.log('❌ Still having issues - checking hash...');
            console.log('Stored hash:', updatedUser.password.substring(0, 20) + '...');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        console.log('\n🎉 User password fixed!');
        console.log('You can now login with:');
        console.log('Email: Nadeemjabir1@gmail.com');
        console.log('Password: Nadeem@0331');

    } catch (error) {
        console.error('❌ Error fixing password:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

fixUserPassword();


