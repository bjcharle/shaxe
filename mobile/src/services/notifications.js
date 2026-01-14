import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationsService {
  // Register device for push notifications
  static async registerForPushNotifications() {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await AsyncStorage.setItem('expo_push_token', token.data);
      console.log('Expo push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Failed to get push token', error);
      return null;
    }
  }

  // Get stored push token
  static async getPushToken() {
    try {
      return await AsyncStorage.getItem('expo_push_token');
    } catch (error) {
      console.error('Failed to get push token', error);
      return null;
    }
  }

  // Send push token to backend to register device
  static async registerDeviceWithBackend(userId, api) {
    try {
      const pushToken = await this.getPushToken();
      if (!pushToken) {
        console.log('No push token available');
        return;
      }

      // Register push token with backend
      await api.post(`/users/${userId}/register-device`, {
        pushToken,
        platform: 'ios', // or 'android' - detect this if needed
      });
      console.log('Device registered with backend');
    } catch (error) {
      console.error('Failed to register device with backend', error);
    }
  }

  // Listen for incoming notifications
  static addNotificationListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Listen for notification taps
  static addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      callback(data);
    });
  }

  // Clear all notifications
  static async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  }

  // Request permissions for notifications
  static async requestNotificationPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        return true;
      }

      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions', error);
      return false;
    }
  }
}

export default NotificationsService;
