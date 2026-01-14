const pool = require('../models/database');

class EngagementService {
  static async addEngagement(userId, postId, type) {
    const result = await pool.query(`
      INSERT INTO engagement (post_id, user_id, engagement_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (post_id, user_id, engagement_type) DO NOTHING
      RETURNING *
    `, [postId, userId, type]);

    if (result.rows.length > 0) {
      // Recalculate trending
      const TrendingService = require('./TrendingService');
      await TrendingService.updateTrendingCache(postId);
    }

    return result.rows[0];
  }

  static async getEngagementStats(postId) {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes,
        COUNT(*) FILTER (WHERE engagement_type = 'dislike') as dislikes,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares,
        COUNT(*) FILTER (WHERE engagement_type = 'shame') as shames,
        COUNT(*) FILTER (WHERE engagement_type = 'shaxe_view') as shaxe_views,
        COUNT(DISTINCT user_id) as unique_engagers
      FROM engagement
      WHERE post_id = $1
    `, [postId]);

    return result.rows[0];
  }

  static async removeEngagement(postId, userId, type) {
    const result = await pool.query(`
      DELETE FROM engagement
      WHERE post_id = $1 AND user_id = $2 AND engagement_type = $3
      RETURNING *
    `, [postId, userId, type]);

    if (result.rows.length > 0) {
      const TrendingService = require('./TrendingService');
      await TrendingService.updateTrendingCache(postId);
    }

    return result.rows[0];
  }
}

module.exports = EngagementService;
