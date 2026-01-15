import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import '../styles/pages.css';

export default function Admin() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="page-container">
      <div className="admin-container">
        <h2>Admin Dashboard</h2>
        <div className="admin-sections">
          <div className="admin-section">
            <h3>Moderation Queue</h3>
            <p>Review reported content</p>
          </div>
          <div className="admin-section">
            <h3>User Management</h3>
            <p>Manage user accounts</p>
          </div>
          <div className="admin-section">
            <h3>Analytics</h3>
            <p>View platform statistics</p>
          </div>
        </div>
        {/* TODO: Add admin functionality */}
        <div className="placeholder">
          Admin dashboard will be implemented here
        </div>
      </div>
    </div>
  );
}
