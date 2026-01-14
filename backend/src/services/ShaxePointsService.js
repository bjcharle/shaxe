const pool = require('../models/database');

class ShaxePointsService {
  static async getBalance(userId) {
    const result = await pool.query(
      'SELECT * FROM shaxe_points WHERE user_id = $1',
      [userId]
    );
    if (!result.rows.length) {
      await pool.query(
        'INSERT INTO shaxe_points (user_id, balance, total_earned) VALUES ($1, $2, $2)',
        [userId, process.env.SHAXE_POINTS_INITIAL || 100]
      );
      return await this.getBalance(userId);
    }
    return result.rows[0];
  }

  static async usePoints(userId, amount, postId) {
    const balance = await this.getBalance(userId);
    
    if (balance.balance < amount) {
      throw new Error('Insufficient shaxe points');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour shield

    await pool.query(
      'UPDATE shaxe_points SET balance = balance - $1, total_spent = total_spent + $1 WHERE user_id = $2',
      [amount, userId]
    );

    await pool.query(
      'INSERT INTO shaxe_shield_history (post_id, user_id, points_used, shield_end_time) VALUES ($1, $2, $3, $4)',
      [postId, userId, amount, expiresAt]
    );

    await pool.query(
      'UPDATE posts SET is_shielded = true, shield_expires_at = $1 WHERE id = $2',
      [expiresAt, postId]
    );

    await pool.query(
      'INSERT INTO shaxe_point_transactions (to_user_id, amount, transaction_type) VALUES ($1, $2, $3)',
      [userId, amount, 'shield']
    );
  }

  static async addPoints(userId, amount, type = 'earned') {
    await pool.query(
      'UPDATE shaxe_points SET balance = balance + $1, total_earned = total_earned + $1 WHERE user_id = $2',
      [amount, userId]
    );

    await pool.query(
      'INSERT INTO shaxe_point_transactions (to_user_id, amount, transaction_type) VALUES ($1, $2, $3)',
      [userId, amount, type]
    );
  }

  static async transferPoints(fromUserId, toUserId, amount) {
    const senderBalance = await this.getBalance(fromUserId);
    if (senderBalance.balance < amount) {
      throw new Error('Insufficient shaxe points');
    }

    await pool.query(
      'UPDATE shaxe_points SET balance = balance - $1 WHERE user_id = $2',
      [amount, fromUserId]
    );

    await pool.query(
      'UPDATE shaxe_points SET balance = balance + $1 WHERE user_id = $2',
      [amount, toUserId]
    );

    await pool.query(
      'INSERT INTO shaxe_point_transactions (from_user_id, to_user_id, amount, transaction_type) VALUES ($1, $2, $3, $4)',
      [fromUserId, toUserId, amount, 'transfer']
    );
  }
}

module.exports = ShaxePointsService;
