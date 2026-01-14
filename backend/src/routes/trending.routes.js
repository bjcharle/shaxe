const express = require('express');
const router = express.Router();
const pool = require('../models/database');
const TrendingService = require('../services/TrendingService');

// GET /api/trending/posts - get trending posts with period filtering
router.get('/posts', async (req, res) => {
  try {
    const { period = 'day', limit = 50, offset = 0 } = req.query;
    const validPeriods = ['day', 'week', 'month', 'year', 'all-time'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    // Calculate time threshold
    let dateThreshold;
    const now = new Date();
    switch (period) {
      case 'day':
        dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateThreshold = null;
    }

    let query = `
      SELECT 
        p.id, p.user_id, p.content, p.is_adult_content, p.is_shielded, p.created_at,
        u.username, u.is_verified,
        COALESCE(tc.trending_score, 0) as trending_score,
        COUNT(*) FILTER (WHERE e.engagement_type = 'like') as likes,
        COUNT(*) FILTER (WHERE e.engagement_type = 'dislike') as dislikes,
        COUNT(*) FILTER (WHERE e.engagement_type = 'share') as shares,
        COUNT(*) FILTER (WHERE e.engagement_type = 'shame') as shames
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN trending_cache tc ON p.id = tc.post_id
      LEFT JOIN engagement e ON p.id = e.post_id
      WHERE (p.is_shielded = false OR p.shield_expires_at <= NOW())
    `;

    if (dateThreshold) {
      query += ` AND p.created_at >= $1`;
    }

    query += `
      GROUP BY p.id, p.user_id, p.content, p.is_adult_content, p.is_shielded, p.created_at, 
               u.username, u.is_verified, tc.trending_score
      ORDER BY COALESCE(tc.trending_score, 0) DESC, p.created_at DESC
      LIMIT $${dateThreshold ? 2 : 1} OFFSET $${dateThreshold ? 3 : 2}
    `;

    const params = dateThreshold ? [dateThreshold, limit, offset] : [limit, offset];
    const result = await pool.query(query, params);

    res.json({
      period,
      count: result.rows.length,
      posts: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        content: row.content,
        is_adult_content: row.is_adult_content,
        is_shielded: row.is_shielded,
        created_at: row.created_at,
        trending_score: row.trending_score,
        author: {
          username: row.username,
          is_verified: row.is_verified
        },
        engagement: {
          likes: row.likes,
          dislikes: row.dislikes,
          shares: row.shares,
          shames: row.shames
        }
      }))
    });
  } catch (error) {
    console.error('Get trending posts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trending/scores/:postId - get current trending score for a post
router.get('/scores/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      'SELECT * FROM trending_cache WHERE post_id = $1',
      [postId]
    );

    if (!result.rows.length) {
      // Calculate score on the fly if not cached
      const score = await TrendingService.calculateTrendingScore(postId);
      return res.json({
        post_id: postId,
        trending_score: score,
        cached: false
      });
    }

    const cache = result.rows[0];
    res.json({
      post_id: cache.post_id,
      trending_score: cache.trending_score,
      engagement_count: cache.engagement_count,
      unique_engagers: cache.unique_engagers,
      net_sentiment: cache.net_sentiment,
      time_decayed_score: cache.time_decayed_score,
      calculated_at: cache.calculated_at,
      cached: true
    });
  } catch (error) {
    console.error('Get trending score error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trending/hall-of-fame - get hall of fame posts
router.get('/hall-of-fame', async (req, res) => {
  try {
    const { period = 'week', limit = 20, offset = 0 } = req.query;
    const validPeriods = ['day', 'week', 'month', 'year', 'all-time'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const result = await pool.query(`
      SELECT 
        hf.post_id, hf.user_id, hf.trending_score, hf.date_recorded,
        p.content, p.created_at,
        u.username, u.is_verified
      FROM hall_of_fame hf
      JOIN posts p ON hf.post_id = p.id
      JOIN users u ON hf.user_id = u.id
      WHERE hf.period = $1
      ORDER BY hf.trending_score DESC, hf.date_recorded DESC
      LIMIT $2 OFFSET $3
    `, [period, limit, offset]);

    res.json({
      period,
      count: result.rows.length,
      posts: result.rows.map(row => ({
        post_id: row.post_id,
        content: row.content,
        trending_score: row.trending_score,
        created_at: row.created_at,
        author: {
          username: row.username,
          is_verified: row.is_verified
        }
      }))
    });
  } catch (error) {
    console.error('Get hall of fame error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trending/hall-of-shame - get hall of shame posts
router.get('/hall-of-shame', async (req, res) => {
  try {
    const { period = 'week', limit = 20, offset = 0 } = req.query;
    const validPeriods = ['day', 'week', 'month', 'year', 'all-time'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const result = await pool.query(`
      SELECT 
        hs.post_id, hs.user_id, hs.trending_score, hs.date_recorded,
        p.content, p.created_at,
        u.username, u.is_verified
      FROM hall_of_shame hs
      JOIN posts p ON hs.post_id = p.id
      JOIN users u ON hs.user_id = u.id
      WHERE hs.period = $1
      ORDER BY hs.trending_score ASC, hs.date_recorded DESC
      LIMIT $2 OFFSET $3
    `, [period, limit, offset]);

    res.json({
      period,
      count: result.rows.length,
      posts: result.rows.map(row => ({
        post_id: row.post_id,
        content: row.content,
        trending_score: row.trending_score,
        created_at: row.created_at,
        author: {
          username: row.username,
          is_verified: row.is_verified
        }
      }))
    });
  } catch (error) {
    console.error('Get hall of shame error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
