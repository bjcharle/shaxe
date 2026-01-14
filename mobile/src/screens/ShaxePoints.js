import React, { useEffect, useState } from 'react';
import { View, Text, Button, SafeAreaView, TextInput, Alert } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import auth from '../services/auth';
import api from '../services/api';

export default function ShaxePoints() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchaseProductId, setPurchaseProductId] = useState('shaxe_points_pack_1');
  const [shieldPoints, setShieldPoints] = useState('100');
  const [postId, setPostId] = useState('');

  useEffect(() => {
    (async () => {
      const u = await auth.getUser();
      setUser(u);
    })();

    // Initialize IAP
    InAppPurchases.connectAsync();
    const subscription = InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results.forEach(async (purchase) => {
          if (!purchase.acknowledged) {
            // Send purchase token to backend for fulfillment
            try {
              await api.post('/shaxe-points/purchase', { productId: purchase.productId, receipt: purchase.transactionReceipt });
              await InAppPurchases.finishTransactionAsync(purchase, true);
              Alert.alert('Purchase complete', 'Points added to your account.');
            } catch (err) {
              console.error('Purchase fulfillment error', err);
            }
          }
        });
      }
    });

    return () => {
      InAppPurchases.disconnectAsync();
      subscription && subscription.remove && subscription.remove();
    };
  }, []);

  const handleBuyPoints = async () => {
    try {
      await InAppPurchases.getProductsAsync([purchaseProductId]);
      await InAppPurchases.purchaseItemAsync(purchaseProductId);
    } catch (err) {
      console.error('IAP error', err);
      Alert.alert('Purchase failed', 'Could not start purchase flow.');
    }
  };

  const handleShield = async () => {
    if (!postId) return Alert.alert('Post ID required', 'Enter post id to shield');
    setLoading(true);
    try {
      const points = parseInt(shieldPoints, 10) || 0;
      const res = await api.post(`/shaxe-points/shield/${postId}`, { points });
      Alert.alert('Shield applied', res.data.message || 'Post shielded for 24 hours');
      // ideally refresh user balance
      const u = await auth.getUser();
      setUser(u);
    } catch (err) {
      console.error('Shield error', err);
      Alert.alert('Error', 'Failed to shield post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Shaxe Points</Text>
      <Text style={{ marginBottom: 8 }}>Balance: {user?.shaxePoints ?? 0}</Text>

      <View style={{ marginVertical: 12 }}>
        <Text>Buy Points</Text>
        <Button title="Buy Points" onPress={handleBuyPoints} />
      </View>

      <View style={{ marginVertical: 12 }}>
        <Text>Shield a Post (24h)</Text>
        <TextInput placeholder="Post ID" value={postId} onChangeText={setPostId} style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
        <TextInput placeholder="Points to spend" value={shieldPoints} onChangeText={setShieldPoints} keyboardType="numeric" style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
        <Button title="Apply Shield" onPress={handleShield} disabled={loading} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text>Transfer / Buy/Sell features will be implemented in the marketplace.</Text>
      </View>
    </SafeAreaView>
  );
}
