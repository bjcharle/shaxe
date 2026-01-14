import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import Feed from './src/screens/Feed';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';
import Profile from './src/screens/Profile';
import KYC from './src/screens/KYC';
import ShaxePoints from './src/screens/ShaxePoints';
import Compose from './src/screens/Compose';
import PostDetail from './src/screens/PostDetail';
import NotificationsService from './src/services/notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Request notification permissions and register for push notifications
    const initializeNotifications = async () => {
      const permitted = await NotificationsService.requestNotificationPermissions();
      if (permitted) {
        await NotificationsService.registerForPushNotifications();
      }
    };

    initializeNotifications();

    // Listen for incoming notifications
    const notificationListener = NotificationsService.addNotificationListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification taps
    const responseListener = NotificationsService.addNotificationResponseListener(
      (data) => {
        console.log('Notification tapped:', data);
        // Handle notification tap (navigate to relevant screen based on notification type)
        if (data.postId) {
          // Navigate to post detail if available
          console.log('Navigate to post:', data.postId);
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Feed">
        <Stack.Screen name="Feed" component={Feed} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="KYC" component={KYC} />
        <Stack.Screen name="ShaxePoints" component={ShaxePoints} />
        <Stack.Screen name="Compose" component={Compose} />
        <Stack.Screen name="PostDetail" component={PostDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
