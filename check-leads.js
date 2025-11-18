import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Lead = (await import('./models/Lead.js')).default;
    const leads = await Lead.find({ organizationId: 'org-1' });

    console.log('Total leads for org-1:', leads.length);
    console.log('Leads by stage:');

    const stages = {};
    leads.forEach(lead => {
      stages[lead.stage] = (stages[lead.stage] || 0) + 1;
    });

    Object.entries(stages).forEach(([stage, count]) => {
      console.log(`${stage}: ${count} leads`);
    });

    console.log('\nSample leads:');
    leads.slice(0, 5).forEach(lead => {
      console.log(`ID: ${lead.id}, Name: ${lead.name}, Stage: ${lead.stage}, Source: ${lead.source}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLeads();
