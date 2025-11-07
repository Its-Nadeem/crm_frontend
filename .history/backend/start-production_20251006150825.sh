#!/bin/bash

# IntelliCRM Backend Production Startup Script

echo "🚀 Starting IntelliCRM Backend in Production Mode..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database seeder if needed
echo "🌱 Checking database..."
node -e "
import('dotenv').then(async (dotenv) => {
    dotenv.config();
    const mongoose = await import('mongoose');
    await mongoose.default.connect(process.env.MONGODB_URI);
    const User = mongoose.default.model('User', new mongoose.default.Schema({}));
    const count = await User.countDocuments();
    console.log('👥 Users in database:', count);
    if (count === 0) {
        console.log('🌱 Database empty, running seeder...');
        process.exit(1); // Signal to run seeder
    } else {
        console.log('✅ Database already seeded');
        process.exit(0);
    }
}).catch(() => process.exit(0));
"

if [ $? -eq 1 ]; then
    echo "🌱 Running database seeder..."
    npm run seed
fi

# Start the application
echo "🚀 Starting production server..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "✅ IntelliCRM Backend started successfully!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs"
echo "🛑 Stop server: pm2 stop ecosystem.config.js"