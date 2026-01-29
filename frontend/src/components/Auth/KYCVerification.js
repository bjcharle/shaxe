import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Auth.css';

export default function KYCVerification() {
  const [formData, setFormData] = useState({
    fullName: '',
    idType: 'passport',
    idNumber: '',
    country: '',
    idDocument: null,
    proofOfAddress: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('idType', formData.idType);
      data.append('idNumber', formData.idNumber);
      data.append('country', formData.country);
      data.append('idDocument', formData.idDocument);
      data.append('proofOfAddress', formData.proofOfAddress);

      // TODO: Implement KYC verification API call
      console.log('KYC data:', formData);

      // Navigate to profile to complete user information
      navigate('/profile');
    } catch (error) {
      setError('Verification submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card kyc-card">
        <h2>KYC Verification</h2>
        <p className="kyc-description">
          To access all features of Shaxe, please verify your identity.
          This process is secure and your information is encrypted.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Legal Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idType">ID Type</label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleInputChange}
              required
            >
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="national_id">National ID</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">ID Number</label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idDocument">ID Document (Photo)</label>
            <input
              type="file"
              id="idDocument"
              name="idDocument"
              accept="image/*"
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="proofOfAddress">Proof of Address (Photo)</label>
            <input
              type="file"
              id="proofOfAddress"
              name="proofOfAddress"
              accept="image/*"
              onChange={handleInputChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>

        <p className="kyc-note">
          <small>
            You can still use Shaxe with limited features while your verification is being processed.
            You'll receive a notification once approved.
          </small>
        </p>
      </div>
    </div>
  );
}
