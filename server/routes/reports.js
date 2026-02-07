import express from 'express';
import Report from '../models/Report.js';
import { classifyImage } from '../services/featherless.js';
import { enrichReport } from '../services/gemini.js';

const router = express.Router();

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { imageBase64, lat, lng, description } = req.body;

    // Validation
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    // Step 1: Classify image with Featherless
    console.log('🔍 Classifying image with Featherless...');
    const classification = await classifyImage(imageBase64);
    console.log('📋 Classification:', classification);

    // Step 2: Enrich with Gemini
    console.log('✨ Enriching with Gemini...');
    const enrichment = await enrichReport(
      imageBase64,
      classification.issueType,
      classification.confidence,
      description
    );
    console.log('📝 Enrichment:', enrichment);

    // Step 3: Create report document
    const report = new Report({
      imageBase64,
      description: description || '',
      location: {
        type: 'Point',
        coordinates: [lng, lat] // MongoDB uses [lng, lat] order
      },
      issueType: classification.issueType,
      confidence: classification.confidence,
      classificationFailed: classification.classificationFailed,
      summary: enrichment.summary,
      severity: enrichment.severity,
      department: enrichment.department,
      reason: enrichment.reason,
      enrichmentFailed: enrichment.enrichmentFailed
    });

    // Step 4: Save to MongoDB
    await report.save();
    console.log('💾 Report saved:', report._id);

    // Return success with full report
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      details: error.message
    });
  }
});

// GET /api/reports - Fetch reports (with optional bbox filter)
router.get('/', async (req, res) => {
  try {
    const { bbox, status, limit = 100 } = req.query;
    
    let query = {};

    // Bounding box filter: bbox=swLng,swLat,neLng,neLat
    if (bbox) {
      const [swLng, swLat, neLng, neLat] = bbox.split(',').map(Number);
      if ([swLng, swLat, neLng, neLat].some(isNaN)) {
        return res.status(400).json({ success: false, error: 'Invalid bbox format' });
      }
      query.location = {
        $geoWithin: {
          $box: [[swLng, swLat], [neLng, neLat]]
        }
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Fetch reports (exclude imageBase64 for performance)
    const reports = await Report.find(query)
      .select('-imageBase64')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// GET /api/reports/:id - Fetch single report with full details
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).lean();
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// PATCH /api/reports/:id/status - Update report status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'acknowledged', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('_id status updatedAt').lean();

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report status'
    });
  }
});

export default router;
