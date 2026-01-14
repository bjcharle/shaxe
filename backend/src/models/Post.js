const pool = require('./database');

class Post {
  static async create(userId, content, isAdultContent = false) {
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, is_adult_content) VALUES ($1, $2, $3) RETURNING *',
      [userId, content, isAdultContent]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 20, offset = 0) {
    const result = await pool.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async shield(postId, expiresAt) {
    const result = await pool.query(
      'UPDATE posts SET is_shielded = true, shield_expires_at = $2 WHERE id = $1 RETURNING *',
      [postId, expiresAt]
    );
    return result.rows[0];
  }
}

module.exports = Post;
