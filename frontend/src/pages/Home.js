import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { postsService } from '../services/posts';
import '../styles/pages.css';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postsService.getFeed();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await postsService.createPost(newPost);
      setNewPost('');
      // Refresh feed
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="welcome-section">
          <h1>Welcome to Shaxe</h1>
          <p>A microblogging platform for verified users</p>
          <div className="features">
            <div className="feature">
              <h3>✅ Verified Users</h3>
              <p>KYC-verified community</p>
            </div>
            <div className="feature">
              <h3>🎯 Points System</h3>
              <p>Earn and spend Shaxe points</p>
            </div>
            <div className="feature">
              <h3>📊 Engagement</h3>
              <p>Like, dislike, share, and more</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-layout">
      {/* Main Feed */}
      <div className="main-feed">
        <div className="feed-header">
          <h2>Home</h2>
        </div>

        {/* Post Composer */}
        <div className="post-composer">
          <div className="composer-avatar">
            <div className="avatar-placeholder">{user.username[0].toUpperCase()}</div>
          </div>
          <form onSubmit={handlePostSubmit} className="composer-form">
            <textarea
              placeholder="What's happening?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              maxLength={280}
              rows={3}
            />
            <div className="composer-actions">
              <div className="composer-icons">
                <button type="button" title="Add image">🖼️</button>
                <button type="button" title="Add poll">📊</button>
                <button type="button" title="Add emoji">😊</button>
              </div>
              <button type="submit" className="btn-primary" disabled={!newPost.trim()}>
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="posts-list">
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="empty-feed">
              <h3>No posts yet</h3>
              <p>Be the first to post something!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <div className="post-avatar">
                    {post.author?.username ? post.author.username[0].toUpperCase() : 'U'}
                  </div>
                  <div className="post-meta">
                    <Link to={`/profile/${post.author?.username}`} className="post-username">
                      @{post.author?.username}
                    </Link>
                    {post.author?.is_verified && <span className="verified-badge">✓</span>}
                    <span className="post-time">
                      · {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="post-content">
                  <p>{post.content}</p>
                </div>
                <div className="post-actions">
                  <button title="Like">❤️ {post.engagement?.likes || 0}</button>
                  <button title="Dislike">👎 {post.engagement?.dislikes || 0}</button>
                  <button title="Comment">💬 {post.comments || 0}</button>
                  <button title="Share">🔄 {post.engagement?.shares || 0}</button>
                  <button title="Bookmark">🔖</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="sidebar-right">
        {/* Trends */}
        <div className="trends-widget">
          <h3>Trends for you</h3>
          <div className="trend-item">
            <div className="trend-category">Trending</div>
            <div className="trend-name">#BreakingNews</div>
            <div className="trend-count">1,234 posts</div>
          </div>
          <div className="trend-item">
            <div className="trend-category">Technology</div>
            <div className="trend-name">#AI2026</div>
            <div className="trend-count">856 posts</div>
          </div>
          <div className="trend-item">
            <div className="trend-category">Entertainment</div>
            <div className="trend-name">#MovieNight</div>
            <div className="trend-count">512 posts</div>
          </div>
          <Link to="/explore" className="show-more">Show more</Link>
        </div>

        {/* Who to follow */}
        <div className="who-to-follow-widget">
          <h3>Who to follow</h3>
          <div className="user-suggestion">
            <div className="suggestion-info">
              <div className="avatar-placeholder">U</div>
              <div>
                <div className="suggestion-name">User123</div>
                <div className="suggestion-username">@user123</div>
              </div>
            </div>
            <button className="btn-follow">Follow</button>
          </div>
          <Link to="/explore" className="show-more">Show more</Link>
        </div>
      </div>
    </div>
  );
}
