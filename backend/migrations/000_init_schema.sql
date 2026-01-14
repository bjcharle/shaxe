-- Shaxe Database Schema Initialization
-- Created: January 2026

-- ===========================
-- USERS AND AUTHENTICATION
-- ===========================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(500),
  bio TEXT,
  date_of_birth DATE NOT NULL,
  date_of_birth_private BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  kyc_identity_document_id VARCHAR(255) UNIQUE, -- stores identity number from KYC provider for 1-person-per-account
  full_name VARCHAR(100),
  full_name_private BOOLEAN DEFAULT FALSE,
  location VARCHAR(100), -- country only
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_ignores (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ignored_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_ignores_unique UNIQUE(user_id, ignored_user_id)
);

CREATE TABLE IF NOT EXISTS user_bans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ban_level INT DEFAULT 1, -- 1=24hr, 2=72hr, 3=1wk, 4=2wk, 5=1mo, 6=6mo, 7=1yr
  ban_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ban_end_time TIMESTAMP NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- POSTS AND CONTENT
-- ===========================

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_adult_content BOOLEAN DEFAULT FALSE,
  is_shielded BOOLEAN DEFAULT FALSE,
  shield_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_shares (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  shared_by_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT post_shares_unique UNIQUE(post_id, shared_by_user_id)
);

-- ===========================
-- ENGAGEMENT/VOTING
-- ===========================

CREATE TABLE IF NOT EXISTS engagement (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engagement_type VARCHAR(20) NOT NULL, -- 'like', 'dislike', 'share', 'shame', 'shaxe', 'favorite', 'shaxe_view'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT engagement_unique UNIQUE(post_id, user_id, engagement_type)
);

-- ===========================
-- REPORTING & MODERATION
-- ===========================

CREATE TABLE IF NOT EXISTS content_reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(20) NOT NULL, -- 'post', 'comment', 'user'
  reported_id INT NOT NULL, -- post_id, comment_id, or user_id
  reported_by_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL, -- 'illegal_content', 'hate_speech', 'spam', 'misinformation', 'harassment', 'other'
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- SHAXE POINTS SYSTEM
-- ===========================

CREATE TABLE IF NOT EXISTS shaxe_points (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INT DEFAULT 100,
  total_earned INT DEFAULT 100,
  total_spent INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shaxe_shield_history (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_used INT NOT NULL,
  shield_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shield_end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shaxe_point_transactions (
  id SERIAL PRIMARY KEY,
  from_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  to_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'earned', 'purchase', 'transfer', 'shield'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- TRENDING AND RANKINGS
-- ===========================

CREATE TABLE IF NOT EXISTS trending_cache (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  trending_score FLOAT NOT NULL,
  engagement_count INT NOT NULL,
  unique_engagers INT NOT NULL,
  net_sentiment INT NOT NULL, -- likes + shares - (dislikes + shames)
  time_decayed_score FLOAT NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT trending_cache_unique UNIQUE(post_id)
);

CREATE TABLE IF NOT EXISTS hall_of_fame (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trending_score FLOAT NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'day', 'week', 'month', 'year', 'all_time'
  date_recorded DATE DEFAULT CURRENT_DATE,
  CONSTRAINT hall_of_fame_unique UNIQUE(post_id, period)
);

CREATE TABLE IF NOT EXISTS hall_of_shame (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trending_score FLOAT NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'day', 'week', 'month', 'year', 'all_time'
  date_recorded DATE DEFAULT CURRENT_DATE,
  CONSTRAINT hall_of_shame_unique UNIQUE(post_id, period)
);

-- ===========================
-- NOTIFICATIONS (OPTIONAL)
-- ===========================

CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token VARCHAR(255) NOT NULL,
  platform VARCHAR(50) DEFAULT 'ios',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_devices_unique UNIQUE(user_id, push_token)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- COMMENT ENGAGEMENT
-- ===========================

CREATE TABLE IF NOT EXISTS comment_engagement (
  id SERIAL PRIMARY KEY,
  comment_id INT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engagement_type VARCHAR(20) NOT NULL, -- 'like', 'dislike', 'favorite'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comment_engagement_unique UNIQUE(comment_id, user_id, engagement_type)
);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_kyc_identity ON users(kyc_identity_document_id);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_shielded ON posts(is_shielded);

CREATE INDEX IF NOT EXISTS idx_engagement_post_id ON engagement(post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user_id ON engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_created_at ON engagement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_type ON engagement(engagement_type);

CREATE INDEX IF NOT EXISTS idx_comment_engagement_comment_id ON comment_engagement(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_engagement_user_id ON comment_engagement(user_id);

CREATE INDEX IF NOT EXISTS idx_user_ignores_user_id ON user_ignores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ignores_ignored_user_id ON user_ignores(ignored_user_id);

CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_end_time ON user_bans(ban_end_time);

CREATE INDEX IF NOT EXISTS idx_trending_cache_score ON trending_cache(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_cache_post_id ON trending_cache(post_id);

CREATE INDEX IF NOT EXISTS idx_hall_of_fame_period ON hall_of_fame(period, date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_hall_of_shame_period ON hall_of_shame(period, date_recorded DESC);

CREATE INDEX IF NOT EXISTS idx_shaxe_points_user_id ON shaxe_points(user_id);
CREATE INDEX IF NOT EXISTS idx_shaxe_shield_history_post_id ON shaxe_shield_history(post_id);
CREATE INDEX IF NOT EXISTS idx_shaxe_transactions_user_id ON shaxe_point_transactions(to_user_id);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(shared_by_user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by ON content_reports(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
