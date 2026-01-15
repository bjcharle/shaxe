import React from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages.css';

export default function Home() {
  const { user } = useAuth();

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
    <div className="page-container">
      <div className="feed-container">
        <h2>Home Feed</h2>
        <p>Welcome back, {user.username}!</p>
        {/* TODO: Add PostFeed component */}
        <div className="placeholder">
          Post feed will be implemented here
        </div>
      </div>
    </div>
  );
}
