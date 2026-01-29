const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/users/:userId - get user profile with stats
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user && req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get public profile with privacy-respecting fields
    const publicProfile = await User.getPublicProfile(userId, viewerId);

    // Get user stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes_received,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares_received,
        COUNT(*) as total_engagements_received
      FROM engagement e
      JOIN posts p ON e.post_id = p.id
      WHERE p.user_id = $1
    `, [userId]);

    const postsResult = await pool.query(
      'SELECT COUNT(*) as post_count FROM posts WHERE user_id = $1',
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: viewerId === parseInt(userId) ? user.email : undefined, // Only show own email
        bio: publicProfile.bio,
        profile_picture_url: publicProfile.profile_picture_url,
        full_name: publicProfile.full_name,
        location: publicProfile.location,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status,
        created_at: user.created_at,
        stats: {
          post_count: parseInt(postsResult.rows[0].post_count) || 0,
          likes_received: parseInt(statsResult.rows[0].likes_received) || 0,
          shares_received: parseInt(statsResult.rows[0].shares_received) || 0,
          total_engagements_received: parseInt(statsResult.rows[0].total_engagements_received) || 0
        }
      },
    });
  } catch (error) {
    console.error('Get user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId/posts - get user's posts
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts with engagement stats
    const result = await pool.query(`
      SELECT 
        p.id, p.content, p.is_adult_content, p.is_shielded, p.created_at,
        COUNT(*) FILTER (WHERE e.engagement_type = 'like') as likes,
        COUNT(*) FILTER (WHERE e.engagement_type = 'dislike') as dislikes,
        COUNT(*) FILTER (WHERE e.engagement_type = 'share') as shares,
        COUNT(*) FILTER (WHERE e.engagement_type = 'shame') as shames
      FROM posts p
      LEFT JOIN engagement e ON p.id = e.post_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      user_id: userId,
      count: result.rows.length,
      posts: result.rows.map(row => ({
        id: row.id,
        content: row.content,
        is_adult_content: row.is_adult_content,
        is_shielded: row.is_shielded,
        created_at: row.created_at,
        engagement: {
          likes: parseInt(row.likes) || 0,
          dislikes: parseInt(row.dislikes) || 0,
          shares: parseInt(row.shares) || 0,
          shames: parseInt(row.shames) || 0
        }
      }))
    });
  } catch (error) {
    console.error('Get user posts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/ignore/:userId - add user to ignore list (auth required)
router.post('/ignore/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (currentUserId === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot ignore yourself' });
    }

    // Verify user to ignore exists
    const userToIgnore = await User.findById(userId);
    if (!userToIgnore) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to ignore list
    await pool.query(
      'INSERT INTO user_ignores (user_id, ignored_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [currentUserId, userId]
    );

    res.json({ success: true, message: `User ${userToIgnore.username} ignored` });
  } catch (error) {
    console.error('Ignore user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/unignore/:userId - remove user from ignore list (auth required)
router.post('/unignore/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove from ignore list
    await pool.query(
      'DELETE FROM user_ignores WHERE user_id = $1 AND ignored_user_id = $2',
      [currentUserId, userId]
    );

    const user = await User.findById(userId);
    res.json({ success: true, message: `User ${user?.username} unignored` });
  } catch (error) {
    console.error('Unignore user error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId/ignored - get ignored users list (auth required)
router.get('/:userId/ignored', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user && req.user.userId;
    const { userId } = req.params;

    if (currentUserId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Cannot view other users ignore lists' });
    }

    const result = await pool.query(`
      SELECT u.id, u.username, u.is_verified, ui.created_at
      FROM user_ignores ui
      JOIN users u ON ui.ignored_user_id = u.id
      WHERE ui.user_id = $1
      ORDER BY ui.created_at DESC
    `, [userId]);

    res.json({
      ignored_users: result.rows
    });
  } catch (error) {
    console.error('Get ignored users error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:userId/register-device - register push notification token
router.post('/:userId/register-device', async (req, res) => {
  try {
    const { userId } = req.params;
    const { pushToken, platform = 'ios' } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: 'pushToken required' });
    }

    // Upsert device registration
    await pool.query(
      `INSERT INTO user_devices (user_id, push_token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, push_token) DO UPDATE SET updated_at = NOW()`,
      [userId, pushToken, platform]
    );

    res.json({ success: true, message: 'Device registered' });
  } catch (error) {
    console.error('Register device error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:userId - update user profile
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    const { userId: targetUserId } = req.params;

    // Only allow users to update their own profile
    if (parseInt(userId) !== parseInt(targetUserId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const {
      profile_picture_url,
      bio,
      full_name,
      location,
      full_name_private,
      date_of_birth_private
    } = req.body;

    // Build update object with only provided fields
    const profileData = {};
    if (profile_picture_url !== undefined) profileData.profilePictureUrl = profile_picture_url;
    if (bio !== undefined) profileData.bio = bio;
    if (full_name !== undefined) profileData.fullName = full_name;
    if (location !== undefined) profileData.location = location;
    if (full_name_private !== undefined) profileData.full_name_private = full_name_private;
    if (date_of_birth_private !== undefined) profileData.date_of_birth_private = date_of_birth_private;

    // Update profile
    const updatedUser = await User.updateProfile(targetUserId, profileData);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        bio: updatedUser.bio,
        profile_picture_url: updatedUser.profile_picture_url,
        full_name: updatedUser.full_name,
        location: updatedUser.location,
        full_name_private: updatedUser.full_name_private,
        date_of_birth_private: updatedUser.date_of_birth_private
      }
    });
  } catch (error) {
    console.error('Update profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
