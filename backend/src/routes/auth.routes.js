const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, dateOfBirth } = req.body;

    if (!username || !email || !password || !dateOfBirth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create(username, email, passwordHash, dateOfBirth);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status,
      },
    });
  } catch (error) {
    console.error('Signup error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-kyc (placeholder for KYC service integration)
router.post('/verify-kyc', authenticateToken, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { idDocument, proofOfAddress, fullName } = req.body;

    if (!idDocument || !proofOfAddress || !fullName) {
      return res.status(400).json({ error: 'Missing required KYC documents' });
    }

    // In production, you would call real KYC service and get kycIdentityDocId
    // For now, we'll use a mock identity document ID
    const kycIdentityDocId = `${fullName.toUpperCase().replace(/\s+/g, '')}_${idDocument.slice(-6)}`;

    // Check if this identity is already verified (one account per person)
    const isUsed = await User.isKycIdentityUsed(kycIdentityDocId);
    if (isUsed) {
      return res.status(409).json({
        error: 'This identity is already associated with a verified account',
        message: 'One verified account per person is allowed'
      });
    }

    // TODO: Integrate with real KYC service (Jumio, IDology, etc.)
    // For now, auto-approve in dev environment
    if (process.env.NODE_ENV === 'development') {
      const user = await User.updateKycIdentity(userId, kycIdentityDocId, 'approved');
      
      // Also update full name
      await User.updateProfile(userId, { fullName });

      return res.json({
        success: true,
        status: 'approved',
        user: {
          id: user.id,
          username: user.username,
          is_verified: user.is_verified,
          full_name: user.full_name
        },
        message: 'KYC verification approved!'
      });
    }

    // In production, set status to pending
    await User.updateKycIdentity(userId, kycIdentityDocId, 'pending');

    res.json({
      success: true,
      status: 'pending',
      message: 'KYC verification in progress. This typically takes 24-48 hours.',
      user: {
        id: userId,
        kyc_status: 'pending'
      }
    });
  } catch (error) {
    console.error('KYC error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
