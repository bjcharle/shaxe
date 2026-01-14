const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const ShaxePointsService = require('../services/ShaxePointsService');
const NotificationsService = require('../services/NotificationsService');

// GET /balance - returns authenticated user's Shaxe points balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(400).json({ error: 'User id missing in token' });
    const balance = await ShaxePointsService.getBalance(userId);
    res.json({ balance });
  } catch (err) {
    console.error('Error fetching balance', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /purchase - validate receipt and credit points (verified users only)
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(400).json({ error: 'User id missing in token' });

    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can purchase Shaxe points' });
    }

    const { productId, receipt } = req.body;
    if (!productId || !receipt) return res.status(400).json({ error: 'productId and receipt required' });

    // TODO: Validate receipt with Apple/Google servers. For now accept as valid in dev.
    // Map productId to points. Extend this mapping as needed.
    const productPointsMap = {
      'points.small': 100,
      'points.medium': 550,
      'points.large': 1200,
    };
    const points = productPointsMap[productId] || 0;
    if (points <= 0) return res.status(400).json({ error: 'Unknown productId' });

    // On successful validation, credit the user's account
    await ShaxePointsService.addPoints(userId, points, 'purchase');
    const balance = await ShaxePointsService.getBalance(userId);
    res.json({ success: true, balance });
  } catch (err) {
    console.error('Purchase error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /shield/:postId - spend points to shield a post (verified users only)
router.post('/shield/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) return res.status(400).json({ error: 'User id missing in token' });

    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can shield posts' });
    }

    const { postId } = req.params;
    const { points } = req.body;
    const pointsToUse = Number(points) || 100; // default shield cost

    const result = await ShaxePointsService.usePoints(userId, pointsToUse, postId);
    if (!result.success) return res.status(400).json({ error: result.error || 'Unable to use points' });

    // Send notification to post author
    try {
      await NotificationsService.notifyPostShielded(postId, userId, pointsToUse);
    } catch (err) {
      console.error('Failed to send shield notification', err);
    }

    const balance = await ShaxePointsService.getBalance(userId);
    res.json({ success: true, balance });
  } catch (err) {
    console.error('Shield error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
