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
  
  // Address info (for analytics)
  address: {
    type: String,
    default: ''
  },
  zipcode: {
    type: String,
    default: '',
    index: true
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
  
  // Resolution tracking
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionTimeHours: {
    type: Number,
    default: null
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

// Pre-save hook to calculate resolution time
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
    const createdAt = this.createdAt || new Date();
    this.resolutionTimeHours = Math.round((this.resolvedAt - createdAt) / (1000 * 60 * 60));
  }
  next();
});

// Geospatial index for bounding box queries
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ zipcode: 1, status: 1 });

export default mongoose.model('Report', reportSchema);
