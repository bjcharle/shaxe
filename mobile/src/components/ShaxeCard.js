import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import auth from '../services/auth';
import colors from '../styles/colors';

export default function ShaxeCard({ post }) {
  const navigation = useNavigation();
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [shares, setShares] = useState(post.shares || 0);
  const [loading, setLoading] = useState(false);
  const [canViewAdult, setCanViewAdult] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const user = await auth.getUser();
      if (!mounted) return;
      if (user && user.is_verified && user.date_of_birth) {
        const b = new Date(user.date_of_birth); const n = new Date(); let a = n.getFullYear()-b.getFullYear(); const m = n.getMonth()-b.getMonth(); if (m<0 || (m===0 && n.getDate()<b.getDate())) a--; setCanViewAdult(a>=18);
      } else {
        setCanViewAdult(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const requireVerified = async () => {
    const user = await auth.getUser();
    if (!user || !user.is_verified) {
      Alert.alert(
        'Verification required',
        'You must be a verified user to perform this action. Start KYC now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start KYC', onPress: () => navigation.navigate('KYC') }
        ]
      );
      return false;
    }
    return true;
  };

  const handleEngagement = async (type) => {
    if (loading) return;
    const ok = await requireVerified();
    if (!ok) return;

    setLoading(true);
    try {
      await api.post(`/engagement/${type}/${post.id}`);
      // optimistic UI update
      if (type === 'like') setLikes((l) => l + 1);
      if (type === 'dislike') setDislikes((d) => d + 1);
      if (type === 'share') setShares((s) => s + 1);
      if (type === 'shame') setDislikes((d) => d + 1);
    } catch (err) {
      console.error('Engagement error', err);
      Alert.alert('Error', 'Failed to send engagement.');
    } finally {
      setLoading(false);
    }
  };

  const handleShield = async () => {
    const ok = await requireVerified();
    if (!ok) return;
    try {
      const res = await api.post(`/shaxe-points/shield/${post.id}`, { points: 100 });
      Alert.alert('Shield', res.data.message || 'Shield applied');
    } catch (err) {
      console.error('Shield error', err);
      Alert.alert('Error', 'Failed to apply shield');
    }
  };

  return (
    <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post.id })} activeOpacity={0.9}>
      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: 'bold', color: colors.PRIMARY }}>{post.author}</Text>
        <Text>{post.createdAt || ''}</Text>
      </View>
      <View style={{ marginTop: 8 }}>
        {post.is_adult_content && !canViewAdult ? (
            <View style={{ padding: 12, backgroundColor: '#f8d7da', borderRadius: 6 }}>
            <Text style={{ color: '#721c24' }}>Adult content — verify and confirm you're 18+ to view.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('KYC')}>
              <Text style={{ color: colors.PRIMARY, marginTop: 8 }}>Start verification</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text>{post.content}</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <TouchableOpacity onPress={() => handleEngagement('like')} disabled={loading}><Text>⬆ {likes}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleEngagement('dislike')} disabled={loading}><Text>⬇ {dislikes}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleEngagement('share')} disabled={loading}><Text>➜ {shares}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handleEngagement('shame')} disabled={loading}><Text>⬅</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleShield} disabled={loading}><Text>🛡</Text></TouchableOpacity>
      </View>
      </View>
    </TouchableOpacity>
  );
}
