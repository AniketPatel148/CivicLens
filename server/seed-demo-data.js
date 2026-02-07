// Seed script to update test data with different statuses for demo
// Run with: node seed-demo-data.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const reportSchema = new mongoose.Schema({}, { strict: false });
const Report = mongoose.model('Report', reportSchema);

async function seedDemoData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const reports = await Report.find({}).sort({ createdAt: -1 }).limit(25);
    console.log(`Found ${reports.length} reports`);

    if (reports.length === 0) {
      console.log('No reports found. Please create some reports first via the app.');
      process.exit(0);
    }

    // Distribute statuses for demo
    // First 5: resolved (with resolution times)
    for (let i = 0; i < Math.min(5, reports.length); i++) {
      const hoursAgo = [48, 72, 24, 96, 36][i];
      const resolvedAt = new Date();
      resolvedAt.setHours(resolvedAt.getHours() - hoursAgo);
      
      await Report.updateOne(
        { _id: reports[i]._id },
        { 
          status: 'resolved',
          resolvedAt: resolvedAt,
          resolutionTimeHours: hoursAgo
        }
      );
      console.log(`✅ Set report ${i + 1} to RESOLVED (${hoursAgo}h)`);
    }

    // Next 4: in_progress
    for (let i = 5; i < Math.min(9, reports.length); i++) {
      await Report.updateOne(
        { _id: reports[i]._id },
        { status: 'in_progress' }
      );
      console.log(`🔧 Set report ${i + 1} to IN_PROGRESS`);
    }

    // Next 4: acknowledged
    for (let i = 9; i < Math.min(13, reports.length); i++) {
      await Report.updateOne(
        { _id: reports[i]._id },
        { status: 'acknowledged' }
      );
      console.log(`👀 Set report ${i + 1} to ACKNOWLEDGED`);
    }

    // Rest: pending (default)
    for (let i = 13; i < reports.length; i++) {
      await Report.updateOne(
        { _id: reports[i]._id },
        { status: 'pending' }
      );
      console.log(`⏳ Set report ${i + 1} to PENDING`);
    }

    console.log('\n✨ Demo data seeded successfully!');
    console.log('\nStatus distribution:');
    console.log('- 5 Resolved (with resolution times)');
    console.log('- 4 In Progress');
    console.log('- 4 Acknowledged');
    console.log('- Rest are Pending');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedDemoData();
