# Shaxe Database Schema

## Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(500),
  bio TEXT,
  date_of_birth DATE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_ignores (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ignored_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ignored_user_id)
);

CREATE TABLE user_bans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ban_level INT DEFAULT 1, -- 1=24hr, 2=72hr, 3=1wk, 4=2wk, 5=1mo, 6=6mo, 7=1yr
  ban_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ban_end_time TIMESTAMP NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Posts Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_adult_content BOOLEAN DEFAULT FALSE,
  is_shielded BOOLEAN DEFAULT FALSE,
  shield_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_shares (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  shared_by_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, shared_by_user_id)
);
```

## Engagement Table
```sql
CREATE TABLE engagement (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engagement_type VARCHAR(20) NOT NULL, -- 'like', 'dislike', 'share', 'shame', 'shaxe_view'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, engagement_type)
);
```

## Shaxe Points Table
```sql
CREATE TABLE shaxe_points (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INT DEFAULT 100,
  total_earned INT DEFAULT 100,
  total_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shaxe_shield_history (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_used INT NOT NULL,
  shield_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shield_end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shaxe_point_transactions (
  id SERIAL PRIMARY KEY,
  from_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  to_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'earned', 'purchase', 'transfer', 'shield'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Trending Cache Table
```sql
CREATE TABLE trending_cache (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  trending_score FLOAT NOT NULL,
  engagement_count INT NOT NULL,
  unique_engagers INT NOT NULL,
  net_sentiment INT NOT NULL, -- likes + shares - (dislikes + shames)
  time_decayed_score FLOAT NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id)
);

CREATE TABLE hall_of_fame (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trending_score FLOAT NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'day', 'week', 'month', 'year', 'all_time'
  date_recorded DATE DEFAULT CURRENT_DATE,
  UNIQUE(post_id, period)
);

CREATE TABLE hall_of_shame (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trending_score FLOAT NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'day', 'week', 'month', 'year', 'all_time'
  date_recorded DATE DEFAULT CURRENT_DATE,
  UNIQUE(post_id, period)
);
```

## Indexes for Performance
```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_engagement_post_id ON engagement(post_id);
CREATE INDEX idx_engagement_user_id ON engagement(user_id);
CREATE INDEX idx_engagement_created_at ON engagement(created_at DESC);
CREATE INDEX idx_user_ignores_user_id ON user_ignores(user_id);
CREATE INDEX idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX idx_trending_cache_score ON trending_cache(trending_score DESC);
CREATE INDEX idx_shaxe_points_user_id ON shaxe_points(user_id);
```
