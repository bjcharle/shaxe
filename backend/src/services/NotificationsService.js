const axios = require('axios');
const pool = require('../models/database');

class NotificationsService {
  // Send push notification to a user via Expo
  static async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Get user's push tokens from database
      const result = await pool.query(
        'SELECT push_token FROM user_devices WHERE user_id = $1 AND push_token IS NOT NULL',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return;
      }

      const pushTokens = result.rows.map((row) => row.push_token);

      // Send via Expo Push Notifications API
      const messages = pushTokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      const response = await axios.post('https://exp.host/--/api/v2/push/send', messages);
      console.log('Push notifications sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending push notifications', error);
      throw error;
    }
  }

  // Send notifications to multiple users
  static async sendBulkNotifications(userIds, title, body, data = {}) {
    try {
      const promises = userIds.map((userId) =>
        this.sendPushNotification(userId, title, body, data).catch((err) => {
          console.error(`Failed to send notification to user ${userId}:`, err);
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending bulk notifications', error);
    }
  }

  // Notify users who liked a post about comments
  static async notifyPostEngagement(postId, engagementType, engagingUserId) {
    try {
      // Get post author
      const postResult = await pool.query(
        'SELECT user_id FROM posts WHERE id = $1',
        [postId]
      );

      if (!postResult.rows[0]) return;

      const postAuthorId = postResult.rows[0].user_id;

      // Don't notify user of their own engagement
      if (postAuthorId === engagingUserId) return;

      // Get engaging user's username
      const userResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [engagingUserId]
      );

      const engagingUsername = userResult.rows[0]?.username || 'Someone';

      // Create message based on engagement type
      const messages = {
        like: `${engagingUsername} liked your post`,
        dislike: `${engagingUsername} disliked your post`,
        share: `${engagingUsername} shared your post`,
        shame: `${engagingUsername} shamed your post`,
      };

      const title = 'Post Engagement';
      const body = messages[engagementType] || 'Someone engaged with your post';

      await this.sendPushNotification(postAuthorId, title, body, {
        type: 'post_engagement',
        postId,
        engagementType,
        engagingUserId,
      });
    } catch (error) {
      console.error('Error notifying post engagement', error);
    }
  }

  // Notify when post enters trending
  static async notifyPostTrending(postId) {
    try {
      const postResult = await pool.query(
        'SELECT user_id FROM posts WHERE id = $1',
        [postId]
      );

      if (!postResult.rows[0]) return;

      const postAuthorId = postResult.rows[0].user_id;

      await this.sendPushNotification(postAuthorId, 'Trending Post', 'Your post is now trending!', {
        type: 'post_trending',
        postId,
      });
    } catch (error) {
      console.error('Error notifying post trending', error);
    }
  }

  // Notify users about new posts from followed users (future feature)
  static async notifyNewPost(userId, postAuthorId, postTitle) {
    try {
      const authorResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [postAuthorId]
      );

      const authorUsername = authorResult.rows[0]?.username || 'Someone';

      await this.sendPushNotification(userId, 'New Post', `${authorUsername} posted: ${postTitle}`, {
        type: 'new_post',
        authorId: postAuthorId,
      });
    } catch (error) {
      console.error('Error notifying new post', error);
    }
  }

  // Notify user about shielding
  static async notifyPostShielded(postId, userId, shieldCost) {
    try {
      const userResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [userId]
      );

      const shieldingUsername = userResult.rows[0]?.username || 'Someone';

      const postResult = await pool.query(
        'SELECT user_id FROM posts WHERE id = $1',
        [postId]
      );

      const postAuthorId = postResult.rows[0].user_id;

      // Notify post author
      await this.sendPushNotification(
        postAuthorId,
        'Post Shielded',
        `${shieldingUsername} spent ${shieldCost} Shaxe Points to shield your post`,
        {
          type: 'post_shielded',
          postId,
          shieldCost,
        }
      );
    } catch (error) {
      console.error('Error notifying post shielded', error);
    }
  }
}

module.exports = NotificationsService;
