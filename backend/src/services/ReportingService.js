const pool = require('../models/database');

class ReportingService {
  static async reportContent(reportType, reportedId, reportedByUserId, reason, description) {
    try {
      const validTypes = ['post', 'comment', 'user'];
      const validReasons = ['illegal_content', 'hate_speech', 'spam', 'misinformation', 'harassment', 'other'];

      if (!validTypes.includes(reportType)) {
        throw new Error('Invalid report type');
      }

      if (!validReasons.includes(reason)) {
        throw new Error('Invalid reason');
      }

      // Prevent self-reporting
      if (reportType === 'user' && reportedId === reportedByUserId) {
        throw new Error('Cannot report yourself');
      }

      // Check if user has already reported this content
      const existingReport = await pool.query(
        `SELECT id FROM content_reports 
         WHERE report_type = $1 AND reported_id = $2 AND reported_by_user_id = $3`,
        [reportType, reportedId, reportedByUserId]
      );

      if (existingReport.rows.length > 0) {
        throw new Error('You have already reported this content');
      }

      // Create report
      const result = await pool.query(
        `INSERT INTO content_reports (report_type, reported_id, reported_by_user_id, reason, description, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id, created_at, status`,
        [reportType, reportedId, reportedByUserId, reason, description || null]
      );

      return {
        success: true,
        report_id: result.rows[0].id,
        message: 'Report submitted successfully. Thank you for helping keep Shaxe safe.'
      };
    } catch (error) {
      console.error('Error reporting content:', error);
      throw error;
    }
  }

  static async getReportStatus(reportId) {
    try {
      const result = await pool.query(
        `SELECT id, report_type, reason, status, created_at, updated_at
         FROM content_reports
         WHERE id = $1`,
        [reportId]
      );

      if (!result.rows.length) {
        throw new Error('Report not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting report status:', error);
      throw error;
    }
  }

  static async getMyReports(userId, limit = 20, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT id, report_type, reported_id, reason, status, created_at, updated_at
         FROM content_reports
         WHERE reported_by_user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting user reports:', error);
      throw error;
    }
  }

  /**
   * Admin function to get pending reports
   */
  static async getPendingReports(limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT cr.id, cr.report_type, cr.reported_id, cr.reported_by_user_id, 
                cr.reason, cr.description, cr.status, cr.created_at, cr.updated_at,
                u.username as reported_by_username
         FROM content_reports cr
         JOIN users u ON cr.reported_by_user_id = u.id
         WHERE cr.status = 'pending'
         ORDER BY cr.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting pending reports:', error);
      throw error;
    }
  }

  static async updateReportStatus(reportId, newStatus) {
    try {
      const validStatuses = ['under_review', 'resolved', 'dismissed'];

      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
      }

      const result = await pool.query(
        `UPDATE content_reports
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, status, updated_at`,
        [newStatus, reportId]
      );

      if (!result.rows.length) {
        throw new Error('Report not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }
}

module.exports = ReportingService;
