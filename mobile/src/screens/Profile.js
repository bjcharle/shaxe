import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, Button } from 'react-native';
import colors from '../styles/colors';
import auth from '../services/auth';

export default function Profile({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await auth.getUser();
      setUser(u);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 12, backgroundColor: colors.BG }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.PRIMARY }}>Profile</Text>
      <View style={{ marginTop: 12 }}>
        <Text>Username: {user?.username || '—'}</Text>
        <Text>Shaxe Points: {user?.shaxePoints ?? 0}</Text>
        <Text>Verified: {user?.is_verified ? 'Yes' : 'No'}</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        {!user?.is_verified && (
          <Button title="Start KYC" onPress={() => navigation.navigate('KYC')} />
        )}
        <View style={{ height: 12 }} />
        <Button title="Shaxe Points" onPress={() => navigation.navigate('ShaxePoints')} />
      </View>
    </SafeAreaView>
  );
}
