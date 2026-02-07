import 'dotenv/config';
import mongoose from 'mongoose';
import Report from '../models/Report.js';

const SEED_REPORTS = [
  {
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgc=', // Placeholder
    description: 'Large pothole near the coffee shop on Main Street',
    location: { type: 'Point', coordinates: [-95.3698, 29.7604] },
    issueType: 'pothole',
    confidence: 0.94,
    summary: 'Deep pothole approximately 8 inches wide near storm drain. Risk of tire damage for passing vehicles.',
    severity: 4,
    department: 'public_works',
    reason: 'Road surface damage falls under Public Works street maintenance.',
    status: 'pending'
  },
  {
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgc=',
    description: 'Overflowing trash bin at bus stop',
    location: { type: 'Point', coordinates: [-95.3712, 29.7621] },
    issueType: 'trash',
    confidence: 0.89,
    summary: 'Public trash bin overflowing with litter scattered on sidewalk. Attracting pests.',
    severity: 2,
    department: 'sanitation',
    reason: 'Overflowing public bins are handled by Sanitation Department.',
    status: 'acknowledged'
  },
  {
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgc=',
    description: 'Graffiti on the side of the community center',
    location: { type: 'Point', coordinates: [-95.3650, 29.7589] },
    issueType: 'graffiti',
    confidence: 0.97,
    summary: 'Spray paint vandalism covering approximately 10x6 feet on east wall of community center.',
    severity: 2,
    department: 'police_non_emergency',
    reason: 'Graffiti and vandalism reports go to Police non-emergency for documentation.',
    status: 'pending'
  },
  {
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgc=',
    description: 'Streetlight has been flickering for weeks',
    location: { type: 'Point', coordinates: [-95.3735, 29.7567] },
    issueType: 'streetlight',
    confidence: 0.92,
    summary: 'Streetlight on Oak Avenue flickering intermittently. Creates dark spots at night, potential safety concern.',
    severity: 3,
    department: 'public_works',
    reason: 'Streetlight maintenance is coordinated by Public Works.',
    status: 'in_progress'
  },
  {
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgc=',
    description: 'Illegal dumping behind the strip mall',
    location: { type: 'Point', coordinates: [-95.3678, 29.7642] },
    issueType: 'trash',
    confidence: 0.85,
    summary: 'Large pile of construction debris and household waste dumped behind commercial building.',
    severity: 4,
    department: 'sanitation',
    reason: 'Illegal dumping requires Sanitation Department cleanup and potential investigation.',
    status: 'pending'
  },
  {
    imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgc=',
    description: 'Multiple potholes on residential street',
    location: { type: 'Point', coordinates: [-95.3755, 29.7598] },
    issueType: 'pothole',
    confidence: 0.91,
    summary: 'Cluster of 3 potholes on Cedar Lane, largest approximately 12 inches. Road surface deteriorating.',
    severity: 5,
    department: 'public_works',
    reason: 'Multiple potholes indicate road surface failure requiring urgent Public Works attention.',
    status: 'pending'
  }
];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    console.log('🗑️  Clearing existing reports...');
    await Report.deleteMany({});

    console.log('📝 Inserting seed data...');
    const inserted = await Report.insertMany(SEED_REPORTS);
    console.log(`✅ Inserted ${inserted.length} reports`);

    console.log('\n📊 Seed data summary:');
    console.log('   - Potholes: 2');
    console.log('   - Trash: 2');
    console.log('   - Graffiti: 1');
    console.log('   - Streetlight: 1');
    console.log('\n✨ Seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
