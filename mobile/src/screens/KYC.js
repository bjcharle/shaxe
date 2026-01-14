import React, { useState, useEffect } from 'react';
import { View, Text, Button, SafeAreaView, ActivityIndicator } from 'react-native';
import auth from '../services/auth';
import api from '../services/api';

export default function KYC({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // fetch current KYC status if available
    (async () => {
      const user = await auth.getUser();
      if (user && user.kyc_status) setStatus(user.kyc_status);
    })();
  }, []);

  const startKYC = async () => {
    setLoading(true);
    try {
      // This is a placeholder. In production you'd collect documents and send multipart form-data.
      const payload = { method: 'instant' };
      const res = await auth.initiateKYC(payload);
      // Expecting { status: 'pending' | 'approved' }
      if (res && res.status) {
        setStatus(res.status);
        // If approved and backend returns updated user, refresh stored user
        if (res.user) await auth.setUser(res.user);
      }
    } catch (err) {
      console.error(err);
      alert('KYC initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>KYC Verification</Text>
      <Text style={{ marginBottom: 12 }}>Status: {status || 'not submitted'}</Text>
      {loading ? <ActivityIndicator /> : (
        <Button title={status === 'approved' ? 'Verified' : 'Start KYC'} onPress={startKYC} disabled={status === 'approved'} />
      )}
    </SafeAreaView>
  );
}
