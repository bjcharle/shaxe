import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
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
          <p>Role: {user.role}</p>
          <p>KYC Status: {user.kyc_verified ? 'Verified' : 'Pending'}</p>
        </div>
        {/* TODO: Add profile editing functionality */}
        <div className="placeholder">
          Profile editing will be implemented here
        </div>
      </div>
    </div>
  );
}
