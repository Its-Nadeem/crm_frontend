import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkStages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Stage = (await import('./models/Stage.js')).default;
    const stages = await Stage.find({ organizationId: 'org-1' });

    console.log('Total stages for org-1:', stages.length);
    console.log('Stages:');
    stages.forEach(stage => {
      console.log(`ID: ${stage.id}, Name: ${stage.name}, Color: ${stage.color}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStages();
