const pool = require('../models/database');

class TrendingService {
  static async calculateTrendingScore(postId) {
    const result = await pool.query(`
      SELECT 
        post_id,
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes,
        COUNT(*) FILTER (WHERE engagement_type = 'dislike') as dislikes,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares,
        COUNT(*) FILTER (WHERE engagement_type = 'shame') as shames,
        COUNT(DISTINCT user_id) as unique_engagers,
        COUNT(*) as total_engagement
      FROM engagement
      WHERE post_id = $1 AND engagement_type IN ('like', 'dislike', 'share', 'shame')
      GROUP BY post_id
    `, [postId]);

    if (result.rows.length === 0) return 0;

    const {
      likes = 0,
      dislikes = 0,
      shares = 0,
      shames = 0,
      unique_engagers = 0,
    } = result.rows[0];

    const baseEngagement = (likes + shares) - (dislikes + shames);
    const engagementRatio = (dislikes + shames) / (likes + shares + dislikes + shames || 1);

    // Get post creation time for time decay
    const postData = await pool.query('SELECT created_at FROM posts WHERE id = $1', [postId]);
    if (!postData.rows.length) return 0;

    const createdAt = new Date(postData.rows[0].created_at);
    const hoursOld = (new Date() - createdAt) / (1000 * 60 * 60);
    const timeDecay = Math.exp(-hoursOld / 24); // exponential decay

    let trendingScore = baseEngagement * timeDecay * Math.log(1 + unique_engagers);

    // Check if post should be banned
    if (engagementRatio >= 0.7 && unique_engagers >= 10) {
      // Trigger ban logic
      await this.handleBan(postId);
    }

    return trendingScore;
  }

  static async handleBan(postId) {
    // Get post user
    const postResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (!postResult.rows.length) return;

    const userId = postResult.rows[0].user_id;
    const banDurations = ['24 hours', '72 hours', '1 week', '2 weeks', '1 month', '6 months', '1 year'];

    // Get current ban level for user
    const banResult = await pool.query(
      'SELECT ban_level FROM user_bans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const currentLevel = banResult.rows.length ? banResult.rows[0].ban_level : 0;
    const nextLevel = Math.min(currentLevel + 1, banDurations.length);

    const banEndTime = this.calculateBanEndTime(nextLevel);

    await pool.query(
      'INSERT INTO user_bans (user_id, ban_level, ban_end_time, reason) VALUES ($1, $2, $3, $4)',
      [userId, nextLevel, banEndTime, 'Negative engagement on post']
    );
  }

  static calculateBanEndTime(banLevel) {
    const now = new Date();
    const durations = {
      1: 24 * 60 * 60 * 1000,        // 24 hours
      2: 72 * 60 * 60 * 1000,        // 72 hours
      3: 7 * 24 * 60 * 60 * 1000,    // 1 week
      4: 14 * 24 * 60 * 60 * 1000,   // 2 weeks
      5: 30 * 24 * 60 * 60 * 1000,   // 1 month
      6: 180 * 24 * 60 * 60 * 1000,  // 6 months
      7: 365 * 24 * 60 * 60 * 1000,  // 1 year
    };
    return new Date(now.getTime() + (durations[banLevel] || durations[1]));
  }

  static async updateTrendingCache(postId) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes,
        COUNT(*) FILTER (WHERE engagement_type = 'dislike') as dislikes,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares,
        COUNT(*) FILTER (WHERE engagement_type = 'shame') as shames,
        COUNT(DISTINCT user_id) as unique_engagers,
        COUNT(*) as total_engagement
      FROM engagement
      WHERE post_id = $1 AND engagement_type IN ('like', 'dislike', 'share', 'shame')
      GROUP BY post_id
    `, [postId]);

    let likes = 0, dislikes = 0, shares = 0, shames = 0, unique_engagers = 0, total_engagement = 0;
    
    if (result.rows.length > 0) {
      ({ likes = 0, dislikes = 0, shares = 0, shames = 0, unique_engagers = 0, total_engagement = 0 } = result.rows[0]);
    }

    const net_sentiment = (parseInt(likes) + parseInt(shares)) - (parseInt(dislikes) + parseInt(shames));
    const trending_score = await this.calculateTrendingScore(postId);
    
    await pool.query(`
      INSERT INTO trending_cache (post_id, trending_score, engagement_count, unique_engagers, net_sentiment, time_decayed_score, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (post_id) DO UPDATE 
      SET trending_score = $2, engagement_count = $3, unique_engagers = $4, net_sentiment = $5, time_decayed_score = $6, calculated_at = NOW()
    `, [postId, trending_score, total_engagement, unique_engagers, net_sentiment, trending_score]);
  }

  static async getTrendingPosts(limit = 20, offset = 0, period = 'day') {
    const periodMap = {
      'hour': '1 hour',
      'day': '1 day',
      'week': '7 days',
      'month': '30 days',
      'year': '365 days',
    };

    const result = await pool.query(`
      SELECT p.*, u.username,
             tc.trending_score,
             COALESCE(eng.like_count, 0) as like_count,
             COALESCE(eng.dislike_count, 0) as dislike_count,
             COALESCE(eng.share_count, 0) as share_count,
             COALESCE(eng.shame_count, 0) as shame_count
      FROM trending_cache tc
      JOIN posts p ON tc.post_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id,
          SUM(CASE WHEN engagement_type = 'like' THEN 1 ELSE 0 END) as like_count,
          SUM(CASE WHEN engagement_type = 'dislike' THEN 1 ELSE 0 END) as dislike_count,
          SUM(CASE WHEN engagement_type = 'share' THEN 1 ELSE 0 END) as share_count,
          SUM(CASE WHEN engagement_type = 'shame' THEN 1 ELSE 0 END) as shame_count
        FROM engagement
        GROUP BY post_id
      ) eng ON p.id = eng.post_id
      WHERE p.created_at > NOW() - INTERVAL '${periodMap[period] || '1 day'}'
      AND p.is_banned = false
      ORDER BY tc.trending_score DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows;
  }
}

module.exports = TrendingService;
