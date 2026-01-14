const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ReportingService = require('../services/ReportingService');

// POST /api/reports - submit a content report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { report_type, reported_id, reason, description } = req.body;

    // Validate required fields
    if (!report_type || !reported_id || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields: report_type, reported_id, reason',
        validTypes: ['post', 'comment', 'user'],
        validReasons: ['illegal_content', 'hate_speech', 'spam', 'misinformation', 'harassment', 'other']
      });
    }

    const report = await ReportingService.reportContent(
      report_type,
      reported_id,
      userId,
      reason,
      description
    );

    if (!report) {
      return res.status(400).json({ error: 'Failed to create report or report already exists' });
    }

    res.status(201).json({
      success: true,
      report_id: report.id,
      status: report.status,
      created_at: report.created_at,
      message: 'Report submitted successfully. Our moderation team will review this shortly.'
    });
  } catch (error) {
    console.error('Report submission error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/reports/:reportId - get report status
router.get('/:reportId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { reportId } = req.params;

    const report = await ReportingService.getReportStatus(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only allow user to view their own reports (unless admin)
    if (report.reported_by_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      id: report.id,
      report_type: report.report_type,
      reported_id: report.reported_id,
      reason: report.reason,
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at
    });
  } catch (error) {
    console.error('Get report error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/my - get all reports submitted by current user
router.get('/my/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const reports = await ReportingService.getMyReports(userId, limit, offset);

    res.json({
      user_id: userId,
      limit,
      offset,
      reports: reports.map(r => ({
        id: r.id,
        report_type: r.report_type,
        reported_id: r.reported_id,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
    });
  } catch (error) {
    console.error('Get my reports error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/pending - get pending reports for moderation (admin only)
router.get('/admin/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access pending reports' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const reports = await ReportingService.getPendingReports(limit, offset);

    res.json({
      limit,
      offset,
      count: reports.length,
      reports: reports.map(r => ({
        id: r.id,
        report_type: r.report_type,
        reported_id: r.reported_id,
        reported_by_user_id: r.reported_by_user_id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        created_at: r.created_at
      }))
    });
  } catch (error) {
    console.error('Get pending reports error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reports/:reportId/status - update report status (admin only)
router.put('/:reportId/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update report status' });
    }

    const { reportId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    const report = await ReportingService.updateReportStatus(reportId, status);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      id: report.id,
      status: report.status,
      updated_at: report.updated_at,
      message: `Report status updated to ${status}`
    });
  } catch (error) {
    console.error('Update report status error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
