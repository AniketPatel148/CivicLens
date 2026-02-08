import express from 'express';
import Report from '../models/Report.js';
import { classifyImage } from '../services/featherless.js';
import { enrichReport } from '../services/gemini.js';

const router = express.Router();

// Helper: Extract zipcode from address string
const extractZipcode = (address) => {
  if (!address) return '';
  // Match US zipcode patterns (5 digits or 5+4)
  const match = address.match(/\b(\d{5})(-\d{4})?\b/);
  return match ? match[1] : '';
};

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { imageBase64, lat, lng, description, address } = req.body;

    // Validation
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    // Step 1: Call Featherless (for API tracking) - run in background, don't wait
    console.log('🔍 Calling Featherless API (background)...');
    classifyImage(imageBase64).then(result => {
      console.log('📋 Featherless response (not used):', result);
    }).catch(err => {
      console.log('📋 Featherless call completed (error ignored):', err.message);
    });

    // Step 2: Get classification + enrichment from Gemini (this is the data we use)
    console.log('✨ Analyzing with Gemini...');
    const analysis = await enrichReport(imageBase64, description);
    console.log('📝 Gemini Analysis:', analysis);

    // Extract zipcode from address
    const zipcode = extractZipcode(address);

    // Step 3: Create report document (using Gemini's data)
    const report = new Report({
      imageBase64,
      description: description || '',
      location: {
        type: 'Point',
        coordinates: [lng, lat] // MongoDB uses [lng, lat] order
      },
      address: address || '',
      zipcode,
      issueType: analysis.issueType,
      confidence: analysis.confidence,
      classificationFailed: false,
      summary: analysis.summary,
      severity: analysis.severity,
      department: analysis.department,
      reason: analysis.reason,
      enrichmentFailed: analysis.enrichmentFailed
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

// GET /api/reports/stats/summary - Get resolution stats by zipcode
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $match: {
          zipcode: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$zipcode',
          totalReports: { $sum: 1 },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionHours: {
            $avg: {
              $cond: [
                { $ne: ['$resolutionTimeHours', null] },
                '$resolutionTimeHours',
                null
              ]
            }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressReports: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          zipcode: '$_id',
          _id: 0,
          totalReports: 1,
          resolvedReports: 1,
          pendingReports: 1,
          inProgressReports: 1,
          avgResolutionHours: { $round: ['$avgResolutionHours', 1] },
          avgResolutionDays: { $round: [{ $divide: ['$avgResolutionHours', 24] }, 1] },
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolvedReports', '$totalReports'] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    // Also get overall stats
    const overall = await Report.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionHours: {
            $avg: {
              $cond: [
                { $ne: ['$resolutionTimeHours', null] },
                '$resolutionTimeHours',
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReports: 1,
          resolvedReports: 1,
          avgResolutionHours: { $round: ['$avgResolutionHours', 1] },
          avgResolutionDays: { $round: [{ $divide: ['$avgResolutionHours', 24] }, 1] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: overall[0] || { totalReports: 0, resolvedReports: 0, avgResolutionHours: null },
        byZipcode: stats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

// GET /api/reports/stats/zipcode/:zipcode - Get stats for specific zipcode
router.get('/stats/zipcode/:zipcode', async (req, res) => {
  try {
    const { zipcode } = req.params;

    const stats = await Report.aggregate([
      { $match: { zipcode } },
      {
        $group: {
          _id: '$department',
          totalReports: { $sum: 1 },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionHours: {
            $avg: {
              $cond: [
                { $ne: ['$resolutionTimeHours', null] },
                '$resolutionTimeHours',
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          _id: 0,
          totalReports: 1,
          resolvedReports: 1,
          avgResolutionHours: { $round: ['$avgResolutionHours', 1] },
          avgResolutionDays: { $round: [{ $divide: ['$avgResolutionHours', 24] }, 1] }
        }
      },
      { $sort: { avgResolutionHours: 1 } }
    ]);

    // Get overall zipcode stats
    const overall = await Report.aggregate([
      { $match: { zipcode } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          avgResolutionHours: {
            $avg: {
              $cond: [
                { $ne: ['$resolutionTimeHours', null] },
                '$resolutionTimeHours',
                null
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        zipcode,
        overall: overall[0] || { totalReports: 0, resolvedReports: 0, avgResolutionHours: null },
        byDepartment: stats
      }
    });
  } catch (error) {
    console.error('Error fetching zipcode stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zipcode stats'
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

    // Use findById and save to trigger pre-save hook for resolution time
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.json({
      success: true,
      data: {
        _id: report._id,
        status: report.status,
        resolvedAt: report.resolvedAt,
        resolutionTimeHours: report.resolutionTimeHours,
        updatedAt: report.updatedAt
      }
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
