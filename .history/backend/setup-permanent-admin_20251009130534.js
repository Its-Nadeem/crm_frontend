
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setupPermanentAdmin = async () => {
    try {
        console.log('🔧 Setting up permanent SUPER ADMIN and organization admins...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Ensure SUPER ADMIN exists and is protected
        const superAdminEmail = 'nadeemjabir1@gmail.com';
        const superAdminPassword = 'Nadeem@0331';

        let superAdmin = await User.findOne({ email: superAdminEmail });

        if (!superAdmin) {
            // Create SUPER ADMIN
            superAdmin = await User.create({
                id: 1,
                name: 'Nadeem Jabir (Permanent Owner)',
                email: superAdminEmail,
                password: superAdminPassword,
                role: 'Super Admin',
                organizationId: 'org-1',
                superAdminRole: 'Co-Owner',
                permissions: ['all'],
                isTrackingEnabled: true,
                // Add permanent protection flag
                isPermanentOwner: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Created permanent SUPER ADMIN:', superAdmin.name);
        } else {
            // Update existing SUPER ADMIN to ensure permanent protection
            superAdmin.role = 'Super Admin';
            superAdmin.superAdminRole = 'Co-Owner';
            superAdmin.permissions = ['all'];
            superAdmin.isPermanentOwner = true;
            superAdmin.name = 'Nadeem Jabir (Permanent Owner)';
            await superAdmin.save();



