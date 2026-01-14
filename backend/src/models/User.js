const pool = require('./database');

class User {
  static async create(username, email, passwordHash, dateOfBirth) {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, date_of_birth) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, passwordHash, dateOfBirth]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async updateVerificationStatus(userId, status) {
    const result = await pool.query(
      'UPDATE users SET kyc_status = $1, is_verified = $2 WHERE id = $3 RETURNING *',
      [status, status === 'approved', userId]
    );
    return result.rows[0];
  }

  /**
   * Check if KYC identity document is already used (one verified account per person)
   */
  static async isKycIdentityUsed(kycIdentityDocId) {
    const result = await pool.query(
      'SELECT id FROM users WHERE kyc_identity_document_id = $1 AND is_verified = true',
      [kycIdentityDocId]
    );
    return result.rows.length > 0;
  }

  /**
   * Update KYC identity and verification status
   */
  static async updateKycIdentity(userId, kycIdentityDocId, status) {
    const result = await pool.query(
      'UPDATE users SET kyc_identity_document_id = $1, kyc_status = $2, is_verified = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [kycIdentityDocId, status, status === 'approved', userId]
    );
    return result.rows[0];
  }

  /**
   * Update user profile information
   */
  static async updateProfile(userId, profileData) {
    const { profilePictureUrl, bio, fullName, fullNamePrivate, dateOfBirthPrivate, location } = profileData;

    const result = await pool.query(
      `UPDATE users 
       SET profile_picture_url = COALESCE($1, profile_picture_url),
           bio = COALESCE($2, bio),
           full_name = COALESCE($3, full_name),
           full_name_private = COALESCE($4, full_name_private),
           date_of_birth_private = COALESCE($5, date_of_birth_private),
           location = COALESCE($6, location),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [profilePictureUrl, bio, fullName, fullNamePrivate, dateOfBirthPrivate, location, userId]
    );

    return result.rows[0];
  }

  /**
   * Get public user profile (respect privacy settings)
   */
  static async getPublicProfile(userId, viewerId = null) {
    const result = await pool.query(
      `SELECT id, username, profile_picture_url, bio, location, is_verified, created_at,
              CASE WHEN date_of_birth_private = true THEN NULL ELSE date_of_birth END as date_of_birth,
              CASE WHEN full_name_private = true THEN NULL ELSE full_name END as full_name
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) return null;

    const user = result.rows[0];

    // Get user stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes_received,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares_received,
        COUNT(*) as total_engagements_received
      FROM engagement e
      JOIN posts p ON e.post_id = p.id
      WHERE p.user_id = $1
    `, [userId]);

    const postsResult = await pool.query(
      'SELECT COUNT(*) as post_count FROM posts WHERE user_id = $1',
      [userId]
    );

    return {
      ...user,
      stats: {
        post_count: parseInt(postsResult.rows[0].post_count) || 0,
        likes_received: parseInt(stats.rows[0].likes_received) || 0,
        shares_received: parseInt(stats.rows[0].shares_received) || 0,
        total_engagements_received: parseInt(stats.rows[0].total_engagements_received) || 0
      }
    };
  }
}

module.exports = User;
