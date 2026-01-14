import React, { useState } from 'react';
import { View, Text, TextInput, Button, SafeAreaView } from 'react-native';
import auth from '../services/auth';

export default function Signup({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');

  const handleSignup = async () => {
    try {
      const res = await auth.signup({ username, email, password, dateOfBirth: dob });
      console.log('Signup', res);
      navigation.replace('Feed');
    } catch (err) {
      console.error(err);
      alert('Signup failed');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Sign Up</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} />
      <TextInput placeholder="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} />
      <Button title="Create Account" onPress={handleSignup} />
    </SafeAreaView>
  );
}
