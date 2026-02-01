import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsService } from '../services/posts';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages.css';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const response = await postsService.getPost(postId);
      setPost(response.post);
      setComments(response.comments || []);
      setError('');
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await postsService.addComment(postId, newComment);
      setNewComment('');
      // Refresh comments
      await fetchPostDetail();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEngagement = async (type) => {
    try {
      setError('');
      
      switch (type) {
        case 'like':
          await postsService.likePost(postId);
          break;
        case 'dislike':
          await postsService.dislikePost(postId);
          break;
        case 'share':
          await postsService.sharePost(postId);
          break;
        case 'shame':
          await postsService.shamePost(postId);
          break;
        case 'favorite':
          await postsService.favoritePost(postId);
          break;
        default:
          return;
      }
      
      // Refresh post to show updated counts
      await fetchPostDetail();
    } catch (err) {
      console.error('Engagement error:', err);
      setError(err.response?.data?.error || 'Failed to perform action');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading post...</div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/home')} className="btn-secondary">
          Back to Home
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-container">
        <div className="empty-feed">
          <h3>Post not found</h3>
          <button onClick={() => navigate('/home')} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="post-detail-container">
        {/* Back button */}
        <button onClick={() => navigate('/home')} className="back-button">
          ← Back to Feed
        </button>

        {error && <div className="error-message">{error}</div>}

        {/* Post */}
        <div className="post-detail-card">
          <div className="post-header">
            <div className="post-meta">
              <div className="post-avatar">
                {post.author?.username ? post.author.username[0].toUpperCase() : 'U'}
              </div>
              <Link to={`/profile/${post.author?.username}`} className="post-username">
                @{post.author?.username}
              </Link>
              {post.author?.is_verified && <span className="verified-badge">✓</span>}
              <span className="post-time">
                · {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="post-content">
            <p>{post.content}</p>
          </div>

          <div className="post-actions">
            <button onClick={() => handleEngagement('like')} title="Like" className="engagement-btn">
              <img src="/images/shaxe-like.png" alt="Like" className="engagement-icon" />
              <span>{post.engagement?.likes || 0}</span>
            </button>
            <button onClick={() => handleEngagement('dislike')} title="Dislike" className="engagement-btn">
              <img src="/images/shaxe-dislike.png" alt="Dislike" className="engagement-icon" />
              <span>{post.engagement?.dislikes || 0}</span>
            </button>
            <button onClick={() => handleEngagement('share')} title="Share" className="engagement-btn">
              <img src="/images/shaxe-share.png" alt="Share" className="engagement-icon" />
              <span>{post.engagement?.shares || 0}</span>
            </button>
            <button onClick={() => handleEngagement('shame')} title="Shame" className="engagement-btn">
              <img src="/images/shaxe-shame.png" alt="Shame" className="engagement-icon" />
              <span>{post.engagement?.shames || 0}</span>
            </button>
            <button onClick={() => handleEngagement('favorite')} title="Favorite" className="engagement-btn favorite-btn">
              <span className="favorite-icon">❤️</span>
              <span>{post.engagement?.favorites || 0}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3 className="comments-header">
            Comments ({comments.length})
          </h3>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="comment-form">
              <div className="comment-input-container">
                <div className="post-avatar">
                  {user.username[0].toUpperCase()}
                </div>
                <textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={submitting}
                />
              </div>
              <div className="comment-form-actions">
                <span className="char-count">{newComment.length}/500</span>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="login-prompt">
              <p>Please <Link to="/login">log in</Link> to comment</p>
            </div>
          )}

          {/* Comments List */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="post-avatar comment-avatar">
                      U
                    </div>
                    <div className="comment-meta">
                      <span className="comment-author">User {comment.user_id}</span>
                      <span className="comment-time">
                        · {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
