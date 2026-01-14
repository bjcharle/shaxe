import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import colors from '../styles/colors';
import api from '../services/api';
import auth from '../services/auth';

export default function PostDetail({ route, navigation }) {
  const { postId } = route.params || {};
  const [post, setPost] = useState(null);
  const [engagement, setEngagement] = useState({});
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data.post);
      setEngagement(res.data.engagement || {});
      setComments(res.data.comments || []);
      const u = await auth.getUser();
      setCurrentUser(u);
    } catch (err) {
      console.error('Failed to load post', err);
      Alert.alert('Error', 'Failed to load post');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [postId]);

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

  const doEngagement = async (type) => {
    if (submitting) return;
    const ok = await requireVerified();
    if (!ok) return;
    setSubmitting(true);
    try {
      await api.post(`/engagement/${type}/${postId}`);
      // reload engagement
      const res = await api.get(`/posts/${postId}`);
      setEngagement(res.data.engagement || {});
    } catch (err) {
      console.error('Engage error', err);
      Alert.alert('Error', 'Failed to send engagement');
    } finally {
      setSubmitting(false);
    }
  };

  const doShield = async () => {
    if (submitting) return;
    const ok = await requireVerified();
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/shaxe-points/shield/${postId}`, { points: 100 });
      Alert.alert('Shield', 'Shield applied');
      await load();
    } catch (err) {
      console.error('Shield error', err);
      Alert.alert('Error', 'Failed to apply shield');
    } finally {
      setSubmitting(false);
    }
  };

  const postComment = async () => {
    const text = (commentText || '').trim();
    if (!text) return Alert.alert('Validation', 'Please enter a comment');
    const user = await auth.getUser();
    if (!user) return Alert.alert('Login required', 'Please login to comment');

    // optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, user_id: user.id || user.username, content: text, created_at: new Date().toISOString() };
    setComments((c) => [...c, optimistic]);
    setCommentText('');

    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text });
      if (res.data && res.data.comment) {
        // replace temp comment with server comment
        setComments((c) => c.map(cm => (cm.id === tempId ? res.data.comment : cm)));
      }
    } catch (err) {
      console.error('Comment error', err);
      // remove optimistic comment
      setComments((c) => c.filter(cm => cm.id !== tempId));
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
  };

  const saveEdit = async (commentId) => {
    const text = (editingText || '').trim();
    if (!text) return Alert.alert('Validation', 'Please enter content');
    setSubmitting(true);
    try {
      const res = await api.put(`/posts/${postId}/comments/${commentId}`, { content: text });
      if (res.data && res.data.comment) {
        setComments((c) => c.map(cm => (cm.id === commentId ? res.data.comment : cm)));
        setEditingCommentId(null);
        setEditingText('');
      }
    } catch (err) {
      console.error('Edit comment error', err);
      Alert.alert('Error', 'Failed to edit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/posts/${postId}/comments/${commentId}`);
          setComments((c) => c.filter(cm => cm.id !== commentId));
        } catch (err) {
          console.error('Delete comment error', err);
          Alert.alert('Error', 'Failed to delete comment');
        }
      }}
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  if (!post) return null;

  return (
    <ScrollView style={{ flex: 1, padding: 12, backgroundColor: colors.BG }}>
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.PRIMARY }}>{post.author.username}</Text>
        <Text style={{ color: colors.MUTED }}>{new Date(post.created_at).toLocaleString()}</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        {post.is_adult_content ? (
          <Text style={{ color: colors.DANGER }}>Adult content</Text>
        ) : null}
        <Text style={{ fontSize: 16, color: colors.TEXT }}>{post.content}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Button title={`Like (${engagement.likes || 0})`} onPress={() => doEngagement('like')} />
        <Button title={`Dislike (${engagement.dislikes || 0})`} onPress={() => doEngagement('dislike')} />
        <Button title={`Share (${engagement.shares || 0})`} onPress={() => doEngagement('share')} />
        <Button title={`Shame (${engagement.shames || 0})`} onPress={() => doEngagement('shame')} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button title="Shield (100)" onPress={doShield} />
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, color: colors.PRIMARY }}>Comments</Text>
        <View style={{ marginBottom: 12 }}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginBottom: 8 }}
          />
          <Button title="Post Comment" onPress={postComment} />
        </View>
        {comments.length === 0 ? (
          <Text style={{ color: colors.MUTED }}>No comments yet.</Text>
        ) : (
          comments.map(c => (
            <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text style={{ fontWeight: 'bold' }}>{c.user_id}</Text>
              {editingCommentId === c.id ? (
                <View>
                  <TextInput value={editingText} onChangeText={setEditingText} style={{ borderWidth:1, borderColor:'#ccc', padding:8, borderRadius:6, marginVertical:8 }} />
                  <Button title="Save" onPress={() => saveEdit(c.id)} />
                  <Button title="Cancel" onPress={() => { setEditingCommentId(null); setEditingText(''); }} />
                </View>
              ) : (
                <Text>{c.content}</Text>
              )}
              {currentUser && (String(c.user_id) === String(currentUser.id) || String(currentUser.id) === String(c.user_id)) && (
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <Button title="Edit" onPress={() => startEdit(c)} />
                  <View style={{ width: 8 }} />
                  <Button title="Delete" color="#d9534f" onPress={() => deleteComment(c.id)} />
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
