const pool = require('../models/database');

class PointsEarningService {
  /**
   * Award points for various interactions
   * Only verified users earn points
   */

  static async awardPointsForEngagement(userId, engagementType, postId) {
    // Check if user is verified
    const user = await pool.query('SELECT is_verified FROM users WHERE id = $1', [userId]);
    if (!user.rows.length || !user.rows[0].is_verified) {
      return { awarded: false, reason: 'Only verified users can earn points' };
    }

    const pointValues = {
      'like': 1,
      'dislike': 1,
      'share': 2,
      'shame': 1,
      'favorite': 1
    };

    const points = pointValues[engagementType] || 0;
    if (points <= 0) return { awarded: false };

    try {
      await pool.query(
        'UPDATE shaxe_points SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2',
        [points, userId]
      );

      await pool.query(
        'INSERT INTO shaxe_point_transactions (to_user_id, amount, transaction_type) VALUES ($1, $2, $3)',
        [userId, points, `engagement_${engagementType}`]
      );

      return { awarded: true, points };
    } catch (error) {
      console.error('Error awarding points for engagement:', error);
      return { awarded: false, error: error.message };
    }
  }

  static async awardPointsForComment(userId, commentId) {
    // Check if user is verified
    const user = await pool.query('SELECT is_verified FROM users WHERE id = $1', [userId]);
    if (!user.rows.length || !user.rows[0].is_verified) {
      return { awarded: false, reason: 'Only verified users can earn points' };
    }

    const points = 1; // 1 point per comment

    try {
      await pool.query(
        'UPDATE shaxe_points SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2',
        [points, userId]
      );

      await pool.query(
        'INSERT INTO shaxe_point_transactions (to_user_id, amount, transaction_type) VALUES ($1, $2, $3)',
        [userId, points, 'comment']
      );

      return { awarded: true, points };
    } catch (error) {
      console.error('Error awarding points for comment:', error);
      return { awarded: false, error: error.message };
    }
  }

  /**
   * Calculate net sentiment score for post/comment
   * Positive interactions: likes, shares, favorites
   * Negative interactions: dislikes, shames
   * Award/deduct points based on net sentiment
   */
  static async adjustPointsForNetSentiment(postId, engagementType) {
    try {
      // Get the post owner
      const postResult = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
      if (!postResult.rows.length) return null;

      const postOwnerId = postResult.rows[0].user_id;

      // Calculate engagement breakdown
      const stats = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE engagement_type = 'like') as likes,
          COUNT(*) FILTER (WHERE engagement_type = 'dislike') as dislikes,
          COUNT(*) FILTER (WHERE engagement_type = 'share') as shares,
          COUNT(*) FILTER (WHERE engagement_type = 'shame') as shames,
          COUNT(*) FILTER (WHERE engagement_type = 'favorite') as favorites
        FROM engagement
        WHERE post_id = $1
      `, [postId]);

      if (!stats.rows.length) return null;

      const stat = stats.rows[0];
      const positiveEngagement = (parseInt(stat.likes) || 0) + (parseInt(stat.shares) || 0) + (parseInt(stat.favorites) || 0);
      const negativeEngagement = (parseInt(stat.dislikes) || 0) + (parseInt(stat.shames) || 0);
      const netSentiment = positiveEngagement - negativeEngagement;

      // Award or deduct points based on net sentiment
      if (netSentiment > 0) {
        // Award points for positive sentiment
        const bonusPoints = Math.floor(netSentiment / 3); // Bonus for every 3 positive interactions
        if (bonusPoints > 0) {
          await pool.query(
            'UPDATE shaxe_points SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2',
            [bonusPoints, postOwnerId]
          );

          await pool.query(
            'INSERT INTO shaxe_point_transactions (to_user_id, amount, transaction_type) VALUES ($1, $2, $3)',
            [postOwnerId, bonusPoints, 'post_sentiment_bonus']
          );

          return { points: bonusPoints, action: 'awarded' };
        }
      } else if (netSentiment < -5) {
        // Deduct points for very negative sentiment
        const penaltyPoints = Math.floor(Math.abs(netSentiment) / 5); // Penalty for every 5 negative interactions
        if (penaltyPoints > 0) {
          const currentBalance = await pool.query(
            'SELECT balance FROM shaxe_points WHERE user_id = $1',
            [postOwnerId]
          );

          if (currentBalance.rows.length && currentBalance.rows[0].balance >= penaltyPoints) {
            await pool.query(
              'UPDATE shaxe_points SET balance = balance - $1, total_spent = total_spent + $1 WHERE user_id = $2',
              [penaltyPoints, postOwnerId]
            );

            await pool.query(
              'INSERT INTO shaxe_point_transactions (to_user_id, amount, transaction_type) VALUES ($1, $2, $3)',
              [postOwnerId, penaltyPoints, 'post_sentiment_penalty']
            );

            return { points: penaltyPoints, action: 'deducted' };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error adjusting points for net sentiment:', error);
      return null;
    }
  }
}

module.exports = PointsEarningService;
