# Implementation Guide

Step-by-step guide to complete the Shaxe application development.

## Part 1: Database Setup

### Step 1: Create Migration Script

Create file: `backend/migrations/001_init_schema.sql`

```sql
-- Shaxe Database Schema
-- PostgreSQL 12+

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT false,
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  kyc_submission_date TIMESTAMP,
  kyc_approval_date TIMESTAMP,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_adult_content BOOLEAN DEFAULT false,
  is_shielded BOOLEAN DEFAULT false,
  shield_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Engagement table
CREATE TABLE engagement (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  engagement_type VARCHAR(50) NOT NULL, -- like, dislike, share, shame, shaxe_view
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, engagement_type)
);

-- More tables...
-- (See docs/DATABASE_SCHEMA.md for complete schema)
```

### Step 2: Run Migration

```bash
cd backend
psql shaxe < migrations/001_init_schema.sql
```

## Part 2: Backend Routes Implementation

### Step 1: Implement Auth Routes

File: `backend/src/routes/auth.routes.js`

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, dateOfBirth } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: passwordHash,
      date_of_birth: dateOfBirth
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 2: Implement Engagement Routes

File: `backend/src/routes/engagement.routes.js`

```javascript
const express = require('express');
const EngagementService = require('../services/EngagementService');
const TrendingService = require('../services/TrendingService');

const router = express.Router();

// POST /api/engagement/like/:postId
router.post('/like/:postId', async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    
    // Check if user is verified
    const user = await User.findById(userId);
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Only verified users can engage' });
    }
    
    // Add engagement
    const engagement = await EngagementService.addEngagement(
      postId,
      userId,
      'like'
    );
    
    // Recalculate trending
    await TrendingService.updateTrendingCache(postId);
    
    res.json({ success: true, engagement });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Similar for dislike, share, shame...

module.exports = router;
```

### Step 3: Implement Trending Routes

File: `backend/src/routes/trending.routes.js`

```javascript
const TrendingService = require('../services/TrendingService');

router.get('/posts', async (req, res) => {
  try {
    const { period = 'day', limit = 20 } = req.query;
    const posts = await TrendingService.getTrendingPosts(period, limit);
    res.json({ posts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

## Part 3: Frontend Integration

### Step 1: Create API Service

File: `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Add token to requests
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const signup = (userData) => API.post('/auth/signup', userData);
export const login = (credentials) => API.post('/auth/login', credentials);

// Post APIs
export const createPost = (content) => API.post('/posts', { content });
export const getFeed = (params) => API.get('/posts/feed', { params });
export const getTrendingPosts = (params) => API.get('/trending/posts', { params });

// Engagement APIs
export const likePost = (postId) => API.post(`/engagement/like/${postId}`);
export const dislikePost = (postId) => API.post(`/engagement/dislike/${postId}`);
export const sharePost = (postId) => API.post(`/engagement/share/${postId}`);
export const shamePost = (postId) => API.post(`/engagement/shame/${postId}`);

export default API;
```

### Step 2: Update Feed Component

File: `frontend/src/pages/Feed.js`

```javascript
import React, { useState, useEffect } from 'react';
import { getFeed } from '../services/api';
import ShaxeCard from '../components/ShaxeCard';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const response = await getFeed();
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await API.post(`/engagement/like/${postId}`);
      loadFeed(); // Reload to get updated stats
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  // Similar for other engagements...

  if (loading) return <div>Loading...</div>;

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Your Feed</h1>
        <button className="btn-compose">Compose Shaxe</button>
      </div>

      <div className="feed-posts">
        {posts.map(post => (
          <ShaxeCard
            key={post.id}
            post={post}
            onLike={() => handleLike(post.id)}
            onDislike={() => handleDislike(post.id)}
            onShare={() => handleShare(post.id)}
            onShame={() => handleShame(post.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default Feed;
```

## Part 4: Testing the Flow

### Step 1: Start Servers

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### Step 2: Test User Flow

1. **Signup**: Create account at http://localhost:3000/signup
2. **Verify**: Check KYC status (demo auto-approves)
3. **Login**: Log in with credentials
4. **Create Post**: Click "Compose Shaxe"
5. **Engage**: Like/dislike/share/shame posts
6. **View Trending**: Check top posts by score
7. **Hall of Fame**: View top-ranked posts

### Step 3: Monitor Backend

Check backend console for logs:
- User creation: "User [id] created"
- Engagement: "Engagement [type] added for post [id]"
- Trending recalc: "Trending score updated for post [id]"

## Part 5: Database Verification

### Check User Creation

```sql
SELECT * FROM users;
SELECT username, is_verified FROM users;
```

### Check Engagement

```sql
SELECT e.engagement_type, COUNT(*) 
FROM engagement e 
GROUP BY e.engagement_type;
```

### Check Trending Scores

```sql
SELECT post_id, trending_score 
FROM trending_cache 
ORDER BY trending_score DESC 
LIMIT 10;
```

## Deployment Checklist

### Backend (Heroku)

```bash
# Create Heroku app
heroku create shaxe-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Frontend (Vercel)

```bash
# Deploy
vercel
```

## Performance Optimization

1. **Index trending cache queries**:
   ```sql
   CREATE INDEX idx_trending_cache_score ON trending_cache(trending_score DESC);
   ```

2. **Cache most viewed posts**:
   - Implement Redis for trending cache

3. **Optimize engagement queries**:
   - Index post_id + user_id in engagement table

4. **Rate limiting**:
   - Add express-rate-limit middleware

## Support & Debugging

**Backend Issues:**
- Check `npm install` completed
- Verify `.env` file exists
- Test database connection: `psql shaxe`

**Frontend Issues:**
- Clear cache: Ctrl+Shift+Delete
- Check console: F12
- Verify REACT_APP_API_URL in .env

**Database Issues:**
- Check PostgreSQL is running
- Verify migrations ran: `\dt` in psql
- Check indexes: `\di`

---

**For more details, see:**
- [API_DESIGN.md](./docs/API_DESIGN.md)
- [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)
- [TRENDING_ALGORITHM.md](./docs/TRENDING_ALGORITHM.md)
