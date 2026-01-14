import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, SafeAreaView, Button, RefreshControl } from 'react-native';
import colors from '../styles/colors';
import ShaxeCard from '../components/ShaxeCard';
import api from '../services/api';
import auth from '../services/auth';

export default function Feed({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allowAdult, setAllowAdult] = useState(false);

  const loadUser = async () => {
    const user = await auth.getUser();
    if (user && user.is_verified && user.date_of_birth) {
      const b = new Date(user.date_of_birth); const n = new Date(); let a = n.getFullYear()-b.getFullYear(); const m = n.getMonth()-b.getMonth(); if (m<0 || (m===0 && n.getDate()<b.getDate())) a--; setAllowAdult(a>=18);
    } else {
      setAllowAdult(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/feed');
      let list = res.data.posts || [];
      if (!allowAdult) list = list.filter(p => !p.is_adult_content);
      setPosts(list);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadUser();
      await fetchPosts();
    })();
  }, [allowAdult]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    await fetchPosts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 12, backgroundColor: colors.BG }}>
      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.PRIMARY }}>Your Feed</Text>
        <View style={{ flexDirection: 'row' }}>
          <Button color={colors.PRIMARY} title="New Post" onPress={() => navigation.navigate('Compose')} />
          <View style={{ width: 8 }} />
          <Button color={colors.PRIMARY} title="Profile" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <ShaxeCard post={item} />
        )}
      />
    </SafeAreaView>
  );
}
