import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkExactEmail = async () => {
    try {
        console.log('🔍 Checking exact email format...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({});
        console.log(`\n👥 Found ${users.length} users:`);

        users.forEach((user, i) => {
            console.log(`${i+1}. Name: ${user.name}`);
            console.log(`   Email: "${user.email}"`);
            console.log(`   Email length: ${user.email.length}`);
            console.log(`   Email char codes: ${[...user.email].map(c => c.charCodeAt(0)).join(', ')}`);
            console.log('   ---');
        });

        // Test different email variations
        const testEmails = [
            'Nadeemjabir1@gmail.com',
            'nadeemjabir1@gmail.com',
            'NADEEMJABIR1@GMAIL.COM',
            'Nadeemjabir1@gmial.com'
        ];

        console.log('\n🔍 Testing email variations:');
        for (const testEmail of testEmails) {
            const user = await User.findOne({ email: testEmail });
            console.log(`"${testEmail}" -> ${user ? '✅ FOUND' : '❌ NOT FOUND'}`);
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkExactEmail();


