import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const verifySuperAdmin = async () => {
    try {
        console.log('🔍 Verifying SUPER ADMIN user in MongoDB...');

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check for SUPER ADMIN user
        const superAdminEmail = 'nadeemjabir1@gmail.com';
        const superAdmin = await User.findOne({ email: superAdminEmail });

        if (!superAdmin) {
            console.log('❌ SUPER ADMIN user not found!');
            await mongoose.disconnect();
            return;
        }

        console.log('✅ SUPER ADMIN user found:');
        console.log(`   Name: ${superAdmin.name}`);
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Role: ${superAdmin.role}`);
        console.log(`   Super Admin Role: ${superAdmin.superAdminRole || 'None'}`);
        console.log(`   Organization ID: ${superAdmin.organizationId || 'None'}`);
        console.log(`   Permissions: ${superAdmin.permissions?.join(', ') || 'None'}`);
        console.log(`   Is Permanent Owner: ${superAdmin.isPermanentOwner ? 'YES' : 'NO'}`);
        console.log(`   Is Tracking Enabled: ${superAdmin.isTrackingEnabled ? 'YES' : 'NO'}`);
        console.log(`   Created: ${superAdmin.createdAt}`);
        console.log(`   Last Updated: ${superAdmin.updatedAt}`);

        // Verify the user has all required properties for SUPER ADMIN
        const requiredProps = {
            role: 'Super Admin',
            superAdminRole: 'Co-Owner',
            isPermanentOwner: true,
            permissions: ['all']
        };

        let allPropsCorrect = true;
        for (const [prop, expectedValue] of Object.entries(requiredProps)) {
            const actualValue = superAdmin[prop];
            if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
                if (!expectedValue.every(val => actualValue.includes(val))) {
                    console.log(`❌ ${prop}: Expected [${expectedValue.join(', ')}], got [${actualValue.join(', ')}]`);
                    allPropsCorrect = false;
                } else {
                    console.log(`✅ ${prop}: [${actualValue.join(', ')}]`);
                }
            } else if (actualValue !== expectedValue) {
                console.log(`❌ ${prop}: Expected "${expectedValue}", got "${actualValue}"`);
                allPropsCorrect = false;
            } else {
                console.log(`✅ ${prop}: "${actualValue}"`);
            }
        }

        if (allPropsCorrect) {
            console.log('\n🎉 SUPER ADMIN is properly configured in MongoDB!');
        } else {
            console.log('\n⚠️ SUPER ADMIN exists but some properties need correction.');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

verifySuperAdmin();


