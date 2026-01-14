# Push Notifications Implementation

## Overview

Shaxe includes real-time push notifications for iOS and Android users via Expo Push Notifications API. Notifications are triggered when:
- A post receives engagement (like, dislike, share, shame)
- A post is shielded by another user
- A post enters the trending list (future feature)

## Mobile Setup

### Dependencies
```bash
npm install expo-notifications
```

### Initialization

The `App.js` automatically initializes notifications on startup:
1. Requests user permission for notifications
2. Gets the Expo push token
3. Registers listeners for incoming notifications
4. Registers listeners for notification taps

### Notification Service (`mobile/src/services/notifications.js`)

```javascript
// Request permissions
const permitted = await NotificationsService.requestNotificationPermissions();

// Get push token
const token = await NotificationsService.getPushToken();

// Register device with backend
await NotificationsService.registerDeviceWithBackend(userId, api);

// Listen for notifications
NotificationsService.addNotificationListener((notification) => {
  console.log('Notification received:', notification);
});

// Listen for notification taps
NotificationsService.addNotificationResponseListener((data) => {
  console.log('User tapped notification:', data);
  // Navigate based on notification type
});
```

## Backend Setup

### Database

Run the migration to create the `user_devices` table:
```sql
CREATE TABLE user_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token VARCHAR(255) NOT NULL,
  platform VARCHAR(50) DEFAULT 'ios',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_devices_unique UNIQUE (user_id, push_token)
);
```

### API Endpoints

#### Register Device Push Token
```
POST /api/users/:userId/register-device
Content-Type: application/json

{
  "pushToken": "ExponentPushToken[xxxxx]",
  "platform": "ios"
}

Response:
{
  "success": true,
  "message": "Device registered"
}
```

### Notification Service (`backend/src/services/NotificationsService.js`)

```javascript
// Send notification to user
await NotificationsService.sendPushNotification(userId, title, body, data);

// Notify on post engagement (auto-called by engagement routes)
await NotificationsService.notifyPostEngagement(postId, engagementType, engagingUserId);

// Notify on post shielded (auto-called by shield route)
await NotificationsService.notifyPostShielded(postId, userId, shieldCost);

// Notify when post trends (future)
await NotificationsService.notifyPostTrending(postId);

// Send bulk notifications
await NotificationsService.sendBulkNotifications(userIds, title, body, data);
```

## Notification Types

### Post Engagement
**Triggered:** When someone likes, dislikes, shares, or shames a post
**Recipients:** Post author
**Payload:**
```json
{
  "type": "post_engagement",
  "postId": 123,
  "engagementType": "like",
  "engagingUserId": 456
}
```
**Message:** "John liked your post" (or disliked/shared/shamed)

### Post Shielded
**Triggered:** When someone shields a post with Shaxe Points
**Recipients:** Post author
**Payload:**
```json
{
  "type": "post_shielded",
  "postId": 123,
  "shieldCost": 100
}
```
**Message:** "John spent 100 Shaxe Points to shield your post"

### Post Trending
**Triggered:** When a post enters the trending list
**Recipients:** Post author
**Payload:**
```json
{
  "type": "post_trending",
  "postId": 123
}
```
**Message:** "Your post is now trending!"

## Testing Notifications

### Local Testing
1. Install Expo CLI: `npm install -g expo-cli`
2. Start mobile app: `expo start`
3. Scan QR code with Expo Go app (iOS) or press `a` (Android)
4. Check console logs for push token: `Expo push token: ExponentPushToken[xxxxx]`

### Sending Test Notifications
You can test the Expo Push Notifications API directly:
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '[
    {
      "to": "ExponentPushToken[xxxxx]",
      "sound": "default",
      "title": "Test Notification",
      "body": "This is a test",
      "data": {
        "type": "test"
      }
    }
  ]'
```

### Production Testing
1. Build and submit app to App Store / Google Play
2. Users must install the app and grant notification permission
3. Notifications are sent automatically when engagement occurs

## Troubleshooting

### Push Token Not Registering
1. Check that user granted notification permission
2. Verify `expo-notifications` is installed: `npm install expo-notifications`
3. Check browser console for errors
4. Ensure network connectivity

### Notifications Not Received
1. Verify device is registered in `user_devices` table:
   ```sql
   SELECT * FROM user_devices WHERE user_id = 123;
   ```
2. Check Expo Push Notifications API status: https://status.expo.io/
3. Verify notification payload is valid (max body length, etc.)
4. Test with curl to isolate issue
5. Check iOS: Settings > Notifications > Shaxe > Allow Notifications

### Duplicate Notifications
- The `user_devices` table has a UNIQUE constraint to prevent duplicate tokens
- If app is reinstalled, old token will be replaced

## Future Enhancements

1. **Notification Preferences:** Allow users to customize which notification types to receive
2. **In-App Notifications:** Show notifications in-app as toast/banner
3. **Notification History:** Store received notifications for user to view
4. **WebSocket Real-Time Updates:** Push trending/engagement updates in real-time (for live feed)
5. **Email Notifications:** Digest emails for users who prefer email over push
6. **Scheduled Notifications:** Hourly trending digest, weekly activity summary

## Environment Variables

```
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send
```

The backend doesn't need additional config—it uses the public Expo Push API. In production, consider:
1. Validating push tokens format before storing
2. Retiring push tokens that fail to deliver
3. Implementing notification rate limiting per user
