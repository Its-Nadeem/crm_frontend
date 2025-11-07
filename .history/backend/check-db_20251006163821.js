import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Lead from './models/Lead.js';

dotenv.config();

const checkDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    const leads = await Lead.find({});
    console.log(`\n📊 Total leads in database: ${leads.length}`);

    if (leads.length > 0) {
      console.log('\n📋 Lead Details:');
      leads.forEach((lead, i) => {
        console.log(`${i+1}. Name: ${lead.name || 'No name'}`);
        console.log(`   Email: ${lead.email || 'No email'}`);
        console.log(`   Phone: ${lead.phone || 'No phone'}`);
        console.log(`   Status: ${lead.status || 'No status'}`);
        console.log(`   Source: ${lead.source || 'No source'}`);
        console.log(`   Created: ${lead.createdAt || 'No date'}`);
        console.log('   ---');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDatabase();


