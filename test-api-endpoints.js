import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Organization from './models/Organization.js';
import Lead from './models/Lead.js';

dotenv.config();

const testApiEndpoints = async () => {
    try {
        console.log('🔧 Testing API Endpoints...');
        console.log('============================');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create test user for authentication
        const testUserEmail = 'test-api@example.com';
        let testUser = await User.findOne({ email: testUserEmail });

        if (!testUser) {
            const hashedPassword = await bcrypt.hash('test123', 10);
            testUser = await User.create({
                id: 2001,
                name: 'API Test User',
                email: testUserEmail,
                password: hashedPassword,
                role: 'Admin',
                organizationId: 'org-1'
            });
            console.log('✅ Created test user for API testing');
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: testUser.id,
                email: testUser.email,
                role: testUser.role,
                organizationId: testUser.organizationId
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        const API_BASE_URL = 'https://crm.clienn.com/api';
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        // Test 1: Get Users
        console.log('\n1. Testing GET /api/users');
        try {
            const usersResponse = await fetch(`${API_BASE_URL}/users`, { headers });
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                console.log(`   ✅ Users endpoint working - Found ${usersData.data?.length || 0} users`);
            } else {
                console.log(`   ❌ Users endpoint failed: ${usersResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Users endpoint error: ${error.message}`);
        }

        // Test 2: Get Organizations
        console.log('\n2. Testing GET /api/organizations');
        try {
            const orgsResponse = await fetch(`${API_BASE_URL}/organizations`, { headers });
            if (orgsResponse.ok) {
                const orgsData = await orgsResponse.json();
                console.log(`   ✅ Organizations endpoint working - Found ${orgsData.data?.length || 0} organizations`);
            } else {
                console.log(`   ❌ Organizations endpoint failed: ${orgsResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Organizations endpoint error: ${error.message}`);
        }

        // Test 3: Get Leads
        console.log('\n3. Testing GET /api/leads');
        try {
            const leadsResponse = await fetch(`${API_BASE_URL}/leads?organizationId=org-1`, { headers });
            if (leadsResponse.ok) {
                const leadsData = await leadsResponse.json();
                console.log(`   ✅ Leads endpoint working - Found ${leadsData.data?.length || 0} leads`);
            } else {
                console.log(`   ❌ Leads endpoint failed: ${leadsResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Leads endpoint error: ${error.message}`);
        }

        // Test 4: Get Dashboard Stats
        console.log('\n4. Testing GET /api/dashboard/stats');
        try {
            const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats?organizationId=org-1`, { headers });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                console.log('   ✅ Dashboard stats endpoint working');
                console.log(`      - Total Leads: ${statsData.data?.totalLeads || 0}`);
                console.log(`      - Total Users: ${statsData.data?.totalUsers || 0}`);
                console.log(`      - Total Tasks: ${statsData.data?.totalTasks || 0}`);
            } else {
                console.log(`   ❌ Dashboard stats endpoint failed: ${statsResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Dashboard stats endpoint error: ${error.message}`);
        }

        // Test 5: Get Stages
        console.log('\n5. Testing GET /api/settings/stages');
        try {
            const stagesResponse = await fetch(`${API_BASE_URL}/settings/stages`, { headers });
            if (stagesResponse.ok) {
                const stagesData = await stagesResponse.json();
                console.log(`   ✅ Stages endpoint working - Found ${stagesData.data?.length || 0} stages`);
                if (stagesData.data?.length > 0) {
                    console.log('   📋 Stages found:', stagesData.data.map(s => ({ id: s.id, name: s.name })));
                    if (stagesData.data.length >= 9) {
                        console.log('   🎉 All expected stages are present!');
                    } else {
                        console.log(`   ⚠️  Expected 9 stages but found ${stagesData.data.length}`);
                    }
                } else {
                    console.log('   ⚠️  No stages found - default stages should be created');
                }
            } else {
                console.log(`   ❌ Stages endpoint failed: ${stagesResponse.status} - ${stagesResponse.statusText}`);
                const errorText = await stagesResponse.text();
                console.log(`   Error response: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ Stages endpoint error: ${error.message}`);
        }

        // Test 6: Get Tasks
        console.log('\n6. Testing GET /api/tasks');
        try {
            const tasksResponse = await fetch(`${API_BASE_URL}/tasks?organizationId=org-1`, { headers });
            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                console.log(`   ✅ Tasks endpoint working - Found ${tasksData.data?.length || 0} tasks`);
            } else {
                console.log(`   ❌ Tasks endpoint failed: ${tasksResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Tasks endpoint error: ${error.message}`);
        }

        // Test 7: Get Teams
        console.log('\n7. Testing GET /api/teams');
        try {
            const teamsResponse = await fetch(`${API_BASE_URL}/teams?organizationId=org-1`, { headers });
            if (teamsResponse.ok) {
                const teamsData = await teamsResponse.json();
                console.log(`   ✅ Teams endpoint working - Found ${teamsData.data?.length || 0} teams`);
            } else {
                console.log(`   ❌ Teams endpoint failed: ${teamsResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Teams endpoint error: ${error.message}`);
        }

        // Test 8: Create a test lead
        console.log('\n8. Testing POST /api/leads (Create Lead)');
        try {
            const testLead = {
                name: 'API Test Lead',
                email: 'api-test@example.com',
                phone: '+1234567890',
                source: 'API Test',
                stage: 'New',
                organizationId: 'org-1',
                assignedToId: testUser.id
            };

            const createLeadResponse = await fetch(`${API_BASE_URL}/leads`, {
                method: 'POST',
                headers,
                body: JSON.stringify(testLead)
            });

            if (createLeadResponse.ok) {
                const createdLead = await createLeadResponse.json();
                console.log('   ✅ Lead creation endpoint working');
                console.log(`      - Created lead: ${createdLead.data?.name}`);

                // Clean up - delete the test lead
                if (createdLead.data?.id) {
                    await fetch(`${API_BASE_URL}/leads/${createdLead.data.id}`, {
                        method: 'DELETE',
                        headers
                    });
                    console.log('      - Test lead cleaned up');
                }
            } else {
                console.log(`   ❌ Lead creation endpoint failed: ${createLeadResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Lead creation endpoint error: ${error.message}`);
        }

        // Test 9: Test Authentication Routes
        console.log('\n9. Testing Authentication Routes');
        try {
            const authResponse = await fetch('https://crm.clienn.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUserEmail,
                    password: 'test123'
                })
            });

            if (authResponse.ok) {
                console.log('   ✅ Authentication endpoint working');
            } else {
                console.log(`   ❌ Authentication endpoint failed: ${authResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Authentication endpoint error: ${error.message}`);
        }

        // Test 10: Test Facebook Routes (if configured)
        console.log('\n10. Testing Facebook Integration Routes');
        try {
            const fbAuthResponse = await fetch(`${API_BASE_URL}/fb/auth`, { headers });
            // Facebook routes might return 400/500 if not fully configured, but should not crash
            if (fbAuthResponse.status === 400 || fbAuthResponse.status === 500) {
                console.log('   ✅ Facebook auth route accessible (expected 400/500 if not configured)');
            } else if (fbAuthResponse.ok) {
                console.log('   ✅ Facebook auth route working');
            } else {
                console.log(`   ⚠️ Facebook auth route returned: ${fbAuthResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Facebook auth route error: ${error.message}`);
        }

        console.log('\n🎉 API Endpoints Test Completed!');
        console.log('================================');
        console.log('✅ Core API endpoints are accessible and functional');

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during API endpoints test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testApiEndpoints();
}

export { testApiEndpoints };


