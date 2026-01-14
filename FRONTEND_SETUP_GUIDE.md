# Shaxe Frontend Setup & Development Guide

**Phase:** 3 - Frontend Integration  
**Status:** Ready to Start  
**Target:** React Web App + Flutter Mobile App Integration

---

## 🎯 Frontend Architecture Overview

```
Frontend Stack:
├── Web (React)
│   ├── Signup/Login UI
│   ├── KYC Verification
│   ├── Post Creation & Feed
│   ├── Engagement UI
│   ├── Profile Management
│   ├── Content Reporting
│   └── Admin Moderation Dashboard
│
└── Mobile (Flutter)
    ├── Authentication
    ├── Post Creation & Feed
    ├── Engagement & Points
    ├── User Profiles
    ├── Content Reporting
    └── Push Notifications
```

---

## 📦 Frontend Directory Structure

### Web Frontend (`frontend/`)
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   ├── api/
│   │   └── client.js                 # Axios client for API calls
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Signup.js
│   │   │   ├── Login.js
│   │   │   └── KYCVerification.js    # NEW
│   │   ├── Posts/
│   │   │   ├── PostFeed.js
│   │   │   ├── CreatePost.js
│   │   │   └── PostCard.js
│   │   ├── Engagement/
│   │   │   ├── EngagementButtons.js
│   │   │   └── PointsDisplay.js      # NEW
│   │   ├── Profile/
│   │   │   ├── UserProfile.js
│   │   │   ├── ProfileEdit.js        # NEW
│   │   │   └── PrivacySettings.js    # NEW
│   │   ├── Reports/
│   │   │   ├── ReportButton.js       # NEW
│   │   │   └── ReportStatus.js       # NEW
│   │   ├── Admin/
│   │   │   └── ModerationDash.js     # NEW
│   │   └── Common/
│   │       ├── Navigation.js
│   │       └── Loading.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Profile.js
│   │   ├── Admin.js                  # NEW
│   │   └── NotFound.js
│   ├── services/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── engagement.js
│   │   ├── reports.js                # NEW
│   │   └── points.js                 # NEW
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── usePost.js
│   │   └── usePoints.js              # NEW
│   ├── styles/
│   │   └── (CSS/SCSS files)
│   ├── context/
│   │   └── AuthContext.js
│   └── utils/
│       ├── constants.js
│       └── helpers.js
├── package.json
└── README.md
```

### Mobile Frontend (`lib/` - Flutter)
```
lib/
├── main.dart
├── models/
│   ├── post.dart
│   ├── user.dart
│   ├── engagement.dart              # NEW
│   ├── report.dart                  # NEW
│   └── points.dart                  # NEW
├── screens/
│   ├── wrapper.dart
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── signup_screen.dart
│   │   └── kyc_verification.dart    # NEW
│   ├── home/
│   │   ├── post_feed.dart
│   │   ├── create_post.dart
│   │   └── post_detail.dart
│   ├── profile/
│   │   ├── user_profile.dart
│   │   ├── profile_edit.dart        # NEW
│   │   └── privacy_settings.dart    # NEW
│   ├── engagement/
│   │   ├── points_display.dart      # NEW
│   │   └── report_content.dart      # NEW
│   └── admin/
│       └── moderation_dash.dart     # NEW
├── services/
│   ├── auth.dart
│   ├── posts.dart
│   ├── engagement.dart              # NEW
│   ├── reports.dart                 # NEW
│   └── notifications.dart           # NEW
└── widgets/
    ├── engagement_buttons.dart
    └── point_badge.dart             # NEW
```

---

## 🚀 Quick Start - React Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
npm install axios react-router-dom jwt-decode
```

### Step 2: Environment Configuration

Create `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Step 3: Start Development Server

```bash
npm start
```

Server runs on `http://localhost:3000`

---

## 🔐 Authentication Setup (React)

### Create `frontend/src/context/AuthContext.js`:

```javascript
import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        { email, password }
      );
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email, username, password, dateOfBirth) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/signup`,
        { email, username, password, dateOfBirth }
      );
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Create `frontend/src/hooks/useAuth.js`:

```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## 📝 KYC Verification Component

### Create `frontend/src/components/Auth/KYCVerification.js`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export function KYCVerification() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    idDocument: null,
    proofOfAddress: null
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('idDocument', formData.idDocument);
      data.append('proofOfAddress', formData.proofOfAddress);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/verify-kyc`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(true);
      setFormData({ fullName: '', idDocument: null, proofOfAddress: null });
    } catch (err) {
      setError(err.response?.data?.error || 'KYC verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc-verification">
      <h2>Verify Your Identity</h2>
      
      {success && (
        <div className="alert alert-success">
          Your KYC verification has been submitted. You'll be verified within 24-48 hours.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ID Document (Photo)</label>
          <input
            type="file"
            name="idDocument"
            accept="image/*"
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Proof of Address (Photo)</label>
          <input
            type="file"
            name="proofOfAddress"
            accept="image/*"
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
```

---

## 👥 User Profile Component

### Create `frontend/src/components/Profile/ProfileEdit.js`:

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export function ProfileEdit({ userId }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    location: '',
    bio: '',
    profile_picture_url: '',
    full_name_private: false,
    date_of_birth_private: false
  });

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setProfile(response.data.user);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${userId}`,
        profile,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-edit">
      <h2>Edit Profile</h2>
      
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="full_name_private"
              checked={profile.full_name_private}
              onChange={handleChange}
            />
            Make name private
          </label>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            placeholder="Country"
            value={profile.location}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Profile Picture URL</label>
          <input
            type="url"
            name="profile_picture_url"
            value={profile.profile_picture_url}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="date_of_birth_private"
              checked={profile.date_of_birth_private}
              onChange={handleChange}
            />
            Make birthday private
          </label>
        </div>

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
```

---

## 🚨 Content Reporting Component

### Create `frontend/src/components/Reports/ReportButton.js`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export function ReportButton({ contentType, contentId }) {
  const { token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: 'spam',
    description: ''
  });

  const reasons = [
    'illegal_content',
    'hate_speech',
    'spam',
    'misinformation',
    'harassment',
    'other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/reports`,
        {
          report_type: contentType,
          reported_id: contentId,
          reason: formData.reason,
          description: formData.description
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      alert('Report submitted. Thank you for helping keep Shaxe safe!');
      setShowModal(false);
      setFormData({ reason: 'spam', description: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="report-btn"
        onClick={() => setShowModal(true)}
        title="Report this content"
      >
        🚨 Report
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Report {contentType}</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Reason</label>
                <select
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, reason: e.target.value }))
                  }
                >
                  {reasons.map(reason => (
                    <option key={reason} value={reason}>
                      {reason.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 💰 Points Display Component

### Create `frontend/src/components/Engagement/PointsDisplay.js`:

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export function PointsDisplay() {
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
    // Poll every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/shaxe-points/balance`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setBalance(response.data.balance);
    } catch (err) {
      console.error('Failed to fetch points balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="points-display">
      <div className="points-badge">
        <span className="points-icon">⭐</span>
        <span className="points-amount">
          {loading ? '...' : balance}
        </span>
        <span className="points-label">Points</span>
      </div>
    </div>
  );
}
```

---

## 📱 Flutter Mobile Setup

### Update `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/wrapper.dart';
import 'services/auth.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AuthService>(create: (_) => AuthService()),
      ],
      child: MaterialApp(
        title: 'Shaxe',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
        ),
        home: const Wrapper(),
      ),
    );
  }
}
```

### Create `lib/services/auth.dart`:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final String baseUrl = 'http://localhost:5000/api';
  final _storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>?> signup({
    required String email,
    required String username,
    required String password,
    required String dateOfBirth,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'username': username,
          'password': password,
          'dateOfBirth': dateOfBirth,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _storage.write(key: 'token', value: data['token']);
        return data;
      } else {
        throw Exception(jsonDecode(response.body)['error']);
      }
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storage.write(key: 'token', value: data['token']);
        return data;
      } else {
        throw Exception(jsonDecode(response.body)['error']);
      }
    } catch (e) {
      return null;
    }
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'token');
  }

  Future<void> logout() async {
    await _storage.delete(key: 'token');
  }
}
```

---

## 🧪 Frontend Testing Setup

### Update `frontend/package.json`:

```json
{
  "name": "shaxe-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.4.0",
    "jwt-decode": "^3.1.2"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "@testing-library/react": "^13.3.0",
    "@testing-library/jest-dom": "^5.16.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  }
}
```

---

## 📋 Development Checklist

### Authentication
- [ ] Signup form with validation
- [ ] Login form
- [ ] Password reset flow
- [ ] Token refresh mechanism
- [ ] Logout functionality

### KYC Verification
- [ ] Document upload form
- [ ] File validation (image types/sizes)
- [ ] Status tracking UI
- [ ] Verification status badge

### Post Management
- [ ] Create post form
- [ ] Post feed with pagination
- [ ] Post detail view
- [ ] Delete post functionality

### Engagement
- [ ] Like/dislike buttons
- [ ] Share button
- [ ] Shame button
- [ ] Favorite button
- [ ] Shaxe button (for unverified)
- [ ] Engagement stats display
- [ ] Points animation on engagement

### User Profiles
- [ ] View user profile
- [ ] Edit profile form
- [ ] Privacy settings UI
- [ ] Profile picture upload
- [ ] User stats display

### Points System
- [ ] Points balance display
- [ ] Points transaction history
- [ ] Purchase points flow
- [ ] Shield post functionality
- [ ] Points earned notifications

### Content Reporting
- [ ] Report button on posts/comments
- [ ] Report form with reasons
- [ ] Report status tracking
- [ ] My reports list

### Admin Features
- [ ] Moderation dashboard
- [ ] Pending reports queue
- [ ] Report review interface
- [ ] Status update workflow
- [ ] User ban interface

### Mobile (Flutter)
- [ ] Migrate screens to new APIs
- [ ] Implement KYC verification
- [ ] Points display and updates
- [ ] Content reporting
- [ ] Profile management

---

## 🔗 API Integration Checklist

### Authentication Endpoints
- [ ] POST `/api/auth/signup`
- [ ] POST `/api/auth/login`
- [ ] POST `/api/auth/verify-kyc`

### User Endpoints
- [ ] GET `/api/users/:userId`
- [ ] PUT `/api/users/:userId`
- [ ] GET `/api/users/:userId/posts`

### Post Endpoints
- [ ] POST `/api/posts`
- [ ] GET `/api/posts/feed`
- [ ] POST `/api/posts/:postId/comment`

### Engagement Endpoints
- [ ] POST `/api/engagement/like/:postId`
- [ ] POST `/api/engagement/dislike/:postId`
- [ ] POST `/api/engagement/share/:postId`
- [ ] POST `/api/engagement/shame/:postId`
- [ ] POST `/api/engagement/shaxe/:postId`
- [ ] POST `/api/engagement/favorite/:postId`
- [ ] GET `/api/engagement/:postId/stats`

### Points Endpoints
- [ ] GET `/api/shaxe-points/balance`
- [ ] POST `/api/shaxe-points/purchase`
- [ ] POST `/api/shaxe-points/shield/:postId`

### Reports Endpoints
- [ ] POST `/api/reports`
- [ ] GET `/api/reports/:reportId`
- [ ] GET `/api/reports/my/list`
- [ ] GET `/api/reports/admin/pending`
- [ ] PUT `/api/reports/:reportId/status`

### Trending Endpoints
- [ ] GET `/api/trending/posts`

---

## 🚀 Next Steps

1. **Set up React app structure** (components, hooks, services)
2. **Implement authentication** (login, signup, token management)
3. **Build core UI components** (posts, engagement, profiles)
4. **Integrate with backend API** (all endpoints)
5. **Add KYC verification flow** (document upload, status tracking)
6. **Implement points system** (display, notifications, purchasing)
7. **Build content reporting** (report submission, tracking)
8. **Create admin dashboard** (moderation queue)
9. **Test all features** (authentication, engagement, reporting)
10. **Deploy frontend** (production build)

---

## 📞 Support

For backend API documentation, see `FEATURE_IMPLEMENTATION_COMPLETE.md`  
For deployment instructions, see `IMPLEMENTATION_STATUS.md`  
For testing guide, see `FINAL_COMPLETION_REPORT.md`
