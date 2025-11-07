import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const debugLogin = async () => {
    try {
        console.log('🔍 Debugging login issue...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check all users
        const users = await User.find({});
        console.log(`\n👥 Found ${users.length} users in database:`);

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            console.log(`${i+1}. Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Password hash length: ${user.password.length}`);

            // Test the password
            const testPassword = 'Nadeem@0331';
            const isValid = await bcrypt.compare(testPassword, user.password);
            console.log(`   Password "${testPassword}" valid: ${isValid ? '✅ YES' : '❌ NO'}`);

            if (isValid) {
                console.log(`   🎉 LOGIN SHOULD WORK for ${user.email}`);
            } else {
                console.log(`   ❌ LOGIN WILL FAIL for ${user.email}`);
            }
            console.log('   ---');
        }

        // Check if there are any issues with the login controller
        console.log('\n🔧 Checking login controller...');

        // Simulate a login request like the frontend would send
        const testEmail = 'Nadeemjabir1@gmail.com';
        const testPassword = 'Nadeem@0331';

        const user = await User.findOne({ email: testEmail });
        if (!user) {
            console.log(`❌ User with email "${testEmail}" not found`);
        } else {
            console.log(`✅ User found: ${user.name}`);

            const isPasswordValid = await bcrypt.compare(testPassword, user.password);
            if (isPasswordValid) {
                console.log(`✅ Password is valid - login should succeed`);
            } else {
                console.log(`❌ Password is invalid - login will fail`);
            }
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

debugLogin();


