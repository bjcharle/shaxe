const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const pool = require('../models/database');

// Helper function to calculate age from date of birth
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper to check if user can view adult content
const canViewAdultContent = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId);
  if (!user || !user.is_verified || !user.date_of_birth) return false;
  return calculateAge(user.date_of_birth) >= 18;
};

// POST /api/posts - create a new post (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { content, isAdultContent = false } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if user is banned
    const banCheck = await pool.query(
      'SELECT ban_end_time FROM user_bans WHERE user_id = $1 AND ban_end_time > NOW() ORDER BY ban_end_time DESC LIMIT 1',
      [userId]
    );
    if (banCheck.rows.length > 0) {
      return res.status(403).json({ error: 'User is currently banned' });
    }

    if (isAdultContent) {
      // Only allow adult content for verified users who are 18+
      const canPostAdult = await canViewAdultContent(userId);
      if (!canPostAdult) {
        return res.status(403).json({ error: 'Only verified users 18+ can post adult content' });
      }
    }

    const post = await Post.create(userId, content, isAdultContent);
    res.json({ success: true, post });
  } catch (error) {
    console.error('Create post error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/feed - get user's feed (paginated, newest first)
router.get('/feed', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const sortBy = req.query.sortBy || 'newest'; // newest, trending, following

    // Determine if viewer can see adult content
    let userId = null;
    let allowAdult = false;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        userId = payload.userId;
        allowAdult = await canViewAdultContent(userId);
      } catch (e) {
        // ignore invalid token
      }
    }

    let query = `
      SELECT 
        p.id, p.user_id, p.content, p.is_adult_content, p.is_shielded, p.shield_expires_at, p.created_at,
        u.username, u.is_verified,
        COALESCE(SUM(CASE WHEN e.engagement_type = 'like' THEN 1 ELSE 0 END), 0) as likes,
        COALESCE(SUM(CASE WHEN e.engagement_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes,
        COALESCE(SUM(CASE WHEN e.engagement_type = 'share' THEN 1 ELSE 0 END), 0) as shares,
        COALESCE(SUM(CASE WHEN e.engagement_type = 'shame' THEN 1 ELSE 0 END), 0) as shames,
        COALESCE(tc.trending_score, 0) as trending_score
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN engagement e ON p.id = e.post_id
      LEFT JOIN trending_cache tc ON p.id = tc.post_id
      WHERE (p.is_shielded = false OR p.shield_expires_at <= NOW())
    `;

    if (!allowAdult) {
      query += ` AND p.is_adult_content = false`;
    }

    // Filter out ignored users if logged in
    if (userId) {
      query += ` AND u.id NOT IN (SELECT ignored_user_id FROM user_ignores WHERE user_id = $3)`;
    }

    query += ` GROUP BY p.id, p.user_id, p.content, p.is_adult_content, p.is_shielded, p.shield_expires_at, p.created_at, u.username, u.is_verified, tc.trending_score`;

    if (sortBy === 'trending') {
      query += ` ORDER BY COALESCE(tc.trending_score, 0) DESC, p.created_at DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    query += ` LIMIT $1 OFFSET $2`;

    const params = userId ? [limit, offset, userId] : [limit, offset];
    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      posts: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        content: row.content,
        is_adult_content: row.is_adult_content,
        is_shielded: row.is_shielded,
        shield_expires_at: row.shield_expires_at,
        created_at: row.created_at,
        trending_score: row.trending_score,
        author: {
          username: row.username,
          is_verified: row.is_verified
        },
        engagement: {
          likes: parseInt(row.likes) || 0,
          dislikes: parseInt(row.dislikes) || 0,
          shares: parseInt(row.shares) || 0,
          shames: parseInt(row.shames) || 0
        }
      }))
    });
  } catch (error) {
    console.error('Feed error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:postId - get a single post with engagement stats and comments
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    let userId = null;
    let allowAdult = false;

    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        userId = payload.userId;
        allowAdult = await canViewAdultContent(userId);
      } catch (e) {
        // ignore
      }
    }

    const result = await pool.query(`
      SELECT p.*, u.id as author_id, u.username as author_username, u.is_verified as author_verified
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [postId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = result.rows[0];

    // Check if viewer can see this post
    if (post.is_adult_content && !allowAdult) {
      return res.status(403).json({ error: 'Adult content restricted' });
    }

    // Get engagement stats
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes,
        COUNT(*) FILTER (WHERE engagement_type = 'dislike') as dislikes,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares,
        COUNT(*) FILTER (WHERE engagement_type = 'shame') as shames,
        COUNT(DISTINCT user_id) as unique_engagers
      FROM engagement
      WHERE post_id = $1
    `, [postId]);

    // Get comments
    let comments = [];
    try {
      const c = await pool.query(
        'SELECT id, user_id, content, created_at FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
        [postId]
      );
      comments = c.rows;
    } catch (e) {
      // comments table might not exist yet
    }

    res.json({
      post: {
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        created_at: post.created_at,
        is_adult_content: post.is_adult_content,
        is_shielded: post.is_shielded,
        shield_expires_at: post.shield_expires_at,
        author: {
          id: post.author_id,
          username: post.author_username,
          is_verified: post.author_verified
        }
      },
      engagement: stats.rows[0] || {},
      comments: comments.length > 0 ? comments : []
    });
  } catch (error) {
    console.error('Get post error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:postId/comments - add a comment (auth required)
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content required' });
    }

    const insert = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, post_id, user_id, content, created_at',
      [postId, userId, content]
    );

    const comment = insert.rows[0];
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Create comment error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:postId/comments/:commentId - edit a comment (owner only)
router.put('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId, commentId } = req.params;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content required' });
    }

    const existing = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1 AND post_id = $2',
      [commentId, postId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Comment not found' });
    const ownerId = existing.rows[0].user_id;
    if (ownerId !== userId) {
      return res.status(403).json({ error: 'Not allowed to edit this comment' });
    }

    const updated = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING id, post_id, user_id, content, created_at',
      [content, commentId]
    );

    res.json({ success: true, comment: updated.rows[0] });
  } catch (error) {
    console.error('Edit comment error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:postId/comments/:commentId - delete a comment (owner or post author)
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId, commentId } = req.params;

    const commentRes = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1 AND post_id = $2',
      [commentId, postId]
    );
    if (!commentRes.rows.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const commentOwner = commentRes.rows[0].user_id;

    const postRes = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    const postOwner = postRes.rows.length ? postRes.rows[0].user_id : null;

    if (userId !== commentOwner && userId !== postOwner) {
      return res.status(403).json({ error: 'Not allowed to delete this comment' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
