import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Common/Navigation';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import KYCVerification from './components/Auth/KYCVerification';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/kyc-verification" element={<KYCVerification />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
