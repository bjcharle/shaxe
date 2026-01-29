import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import '../styles/pages.css';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page-container">
      <div className="profile-container">
        <h2>Profile</h2>
        <div className="profile-info">
          <h3>{user.username}</h3>
          <p>Email: {user.email}</p>
          <p>Verification Status: {user.is_verified ? '✅ Verified' : '❌ Not Verified'}</p>
          
          {!user.is_verified && (
            <div className="verification-prompt">
              <p>Get verified to unlock all features!</p>
              <Link to="/kyc-verification" className="btn-primary">
                Get Verified
              </Link>
            </div>
          )}
        </div>
        {/* TODO: Add profile editing functionality */}
        <div className="placeholder">
          Profile editing will be implemented here
        </div>
      </div>
    </div>
  );
}
