const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EngagementService = require('../services/EngagementService');
const PointsEarningService = require('../services/PointsEarningService');
const User = require('../models/User');
const pool = require('../models/database');

// Helper: verify user is not banned
const checkBanStatus = async (userId) => {
  const result = await pool.query(
    'SELECT ban_end_time FROM user_bans WHERE user_id = $1 AND ban_end_time > NOW() ORDER BY ban_end_time DESC LIMIT 1',
    [userId]
  );
  if (result.rows.length > 0) {
    return { banned: true, banUntil: result.rows[0].ban_end_time };
  }
  return { banned: false };
};

// POST /api/engagement/like/:postId - like a post (verified users only)
router.post('/like/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can like posts' });
    }

    // Check user ban status
    const banStatus = await checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(403).json({ error: `User is banned until ${banStatus.banUntil}` });
    }

    await EngagementService.addEngagement(userId, postId, 'like');
    
    // Award points to user
    await PointsEarningService.awardPointsForEngagement(userId, 'like', postId);
    
    // Adjust post owner's points for sentiment
    await PointsEarningService.adjustPointsForNetSentiment(postId, 'like');
    
    res.json({ success: true, engagement: 'like' });
  } catch (error) {
    console.error('Like error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/engagement/dislike/:postId - dislike a post (verified users only)
router.post('/dislike/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can dislike posts' });
    }

    // Check user ban status
    const banStatus = await checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(403).json({ error: `User is banned until ${banStatus.banUntil}` });
    }

    await EngagementService.addEngagement(userId, postId, 'dislike');
    
    // Award points to user
    await PointsEarningService.awardPointsForEngagement(userId, 'dislike', postId);
    
    // Adjust post owner's points for sentiment
    await PointsEarningService.adjustPointsForNetSentiment(postId, 'dislike');
    
    res.json({ success: true, engagement: 'dislike' });
  } catch (error) {
    console.error('Dislike error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/engagement/share/:postId - share a post (verified users only)
router.post('/share/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can share posts' });
    }

    // Check user ban status
    const banStatus = await checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(403).json({ error: `User is banned until ${banStatus.banUntil}` });
    }

    await EngagementService.addEngagement(userId, postId, 'share');
    
    // Award points to user (share = 2 points)
    await PointsEarningService.awardPointsForEngagement(userId, 'share', postId);
    
    // Adjust post owner's points for sentiment
    await PointsEarningService.adjustPointsForNetSentiment(postId, 'share');
    
    res.json({ success: true, engagement: 'share' });
  } catch (error) {
    console.error('Share error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/engagement/shame/:postId - shame a post (verified users only, triggers ban logic)
router.post('/shame/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can shame posts' });
    }

    // Check user ban status
    const banStatus = await checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(403).json({ error: `User is banned until ${banStatus.banUntil}` });
    }

    await EngagementService.addEngagement(userId, postId, 'shame');
    
    // Award points to user
    await PointsEarningService.awardPointsForEngagement(userId, 'shame', postId);
    
    // Adjust post owner's points for sentiment
    await PointsEarningService.adjustPointsForNetSentiment(postId, 'shame');
    
    res.json({ success: true, engagement: 'shame' });
  } catch (error) {
    console.error('Shame error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/engagement/:postId/:engagementType - remove an engagement vote
router.delete('/:postId/:engagementType', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId, engagementType } = req.params;
    const validTypes = ['like', 'dislike', 'share', 'shame', 'shaxe', 'favorite', 'shaxe_view'];
    
    if (!validTypes.includes(engagementType)) {
      return res.status(400).json({ error: 'Invalid engagement type' });
    }

    await EngagementService.removeEngagement(postId, userId, engagementType);
    res.json({ success: true, message: `${engagementType} removed` });
  } catch (error) {
    console.error('Remove engagement error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagement/:postId/stats - get engagement stats for a post
router.get('/:postId/stats', async (req, res) => {
  try {
    const { postId } = req.params;

    const stats = await EngagementService.getEngagementStats(postId);
    
    res.json({
      post_id: postId,
      engagement: {
        likes: parseInt(stats.likes) || 0,
        dislikes: parseInt(stats.dislikes) || 0,
        shares: parseInt(stats.shares) || 0,
        shames: parseInt(stats.shames) || 0,
        shaxe_views: parseInt(stats.shaxe_views) || 0,
        unique_engagers: parseInt(stats.unique_engagers) || 0
      }
    });
  } catch (error) {
    console.error('Get engagement stats error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagement/:postId/my-engagement - get current user's engagement on a post
router.get('/:postId/my-engagement', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    const result = await pool.query(`
      SELECT engagement_type
      FROM engagement
      WHERE post_id = $1 AND user_id = $2
    `, [postId, userId]);

    const engagements = result.rows.map(row => row.engagement_type);
    res.json({
      post_id: postId,
      engagements: engagements
    });
  } catch (error) {
    console.error('Get user engagement error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/engagement/shaxe/:postId - "shaxe" engagement for unverified users (doesn't affect trending)
router.post('/shaxe/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    // Check user ban status
    const banStatus = await checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(403).json({ error: `User is banned until ${banStatus.banUntil}` });
    }

    await EngagementService.addEngagement(userId, postId, 'shaxe');
    res.json({ success: true, engagement: 'shaxe', message: 'Shaxe recorded (unverified engagement)' });
  } catch (error) {
    console.error('Shaxe error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/engagement/favorite/:postId - favorite a post (all users)
router.post('/favorite/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { postId } = req.params;

    // Check user ban status
    const banStatus = await checkBanStatus(userId);
    if (banStatus.banned) {
      return res.status(403).json({ error: `User is banned until ${banStatus.banUntil}` });
    }

    await EngagementService.addEngagement(userId, postId, 'favorite');
    
    // Award points only if verified user
    const user = await User.findById(userId);
    if (user && user.is_verified) {
      await PointsEarningService.awardPointsForEngagement(userId, 'favorite', postId);
      await PointsEarningService.adjustPointsForNetSentiment(postId, 'favorite');
    }
    
    res.json({ success: true, engagement: 'favorite' });
  } catch (error) {
    console.error('Favorite error', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
