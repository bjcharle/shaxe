import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Switch, Alert } from 'react-native';
import colors from '../styles/colors';
import api from '../services/api';
import auth from '../services/auth';

export default function Compose({ navigation }) {
  const [content, setContent] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [canToggleAdult, setCanToggleAdult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const user = await auth.getUser();
      if (!mounted) return;
      if (user && user.is_verified && user.date_of_birth) {
        const b = new Date(user.date_of_birth); const n = new Date(); let a = n.getFullYear()-b.getFullYear(); const m = n.getMonth()-b.getMonth(); if (m<0 || (m===0 && n.getDate()<b.getDate())) a--; setCanToggleAdult(a>=18);
      } else {
        setCanToggleAdult(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const submit = async () => {
    if (!content.trim()) return Alert.alert('Validation', 'Please enter some content');
    if (isAdult && !canToggleAdult) return Alert.alert('Not allowed', 'You must be a verified user 18+ to post adult content');

    setSubmitting(true);
    try {
      const res = await api.post('/posts', { content, isAdultContent: isAdult });
      if (res.data && res.data.success) {
        Alert.alert('Posted', 'Your post was created');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.data?.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Create post error', err);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: colors.BG }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: colors.PRIMARY }}>Compose Post</Text>
      <TextInput
        multiline
        placeholder="What's happening?"
        value={content}
        onChangeText={setContent}
        style={{ minHeight: 120, borderColor: '#ccc', borderWidth: 1, padding: 8, borderRadius: 6, marginBottom: 12 }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Switch value={isAdult} onValueChange={setIsAdult} disabled={!canToggleAdult} />
        <Text style={{ marginLeft: 8 }}>{isAdult ? 'Mark as adult content' : 'Not adult content'}</Text>
      </View>
      {!canToggleAdult && (
        <Text style={{ color: colors.MUTED, marginBottom: 12 }}>Only verified users aged 18+ can mark content as adult.</Text>
      )}

      <Button title={submitting ? 'Posting...' : 'Post'} onPress={submit} disabled={submitting} />
    </View>
  );
}
