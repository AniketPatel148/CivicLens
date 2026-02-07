import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  // User Input
  imageBase64: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Location (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  
  // AI Classification (Featherless)
  issueType: {
    type: String,
    enum: ['pothole', 'trash', 'graffiti', 'streetlight', 'other'],
    default: 'other'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  
  // AI Enrichment (Gemini)
  summary: {
    type: String,
    default: 'Report received. Pending analysis.'
  },
  severity: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  department: {
    type: String,
    enum: ['public_works', 'sanitation', 'parks', 'utilities', 'police_non_emergency', 'general'],
    default: 'general'
  },
  reason: {
    type: String,
    default: ''
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved'],
    default: 'pending'
  },
  
  // Failure Flags
  classificationFailed: {
    type: Boolean,
    default: false
  },
  enrichmentFailed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Geospatial index for bounding box queries
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model('Report', reportSchema);
