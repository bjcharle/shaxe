// Age-gating middleware
const pool = require('../models/database');

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Populate req.userAge and req.userIsAdult if authenticated
const checkAgeForAdultContent = async (req, res, next) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      req.userAge = null;
      req.userIsAdult = false;
      return next();
    }

    const result = await pool.query('SELECT date_of_birth, is_verified FROM users WHERE id = $1', [userId]);
    if (!result.rows.length) {
      req.userAge = null;
      req.userIsAdult = false;
      return next();
    }

    const { date_of_birth, is_verified } = result.rows[0];
    const age = calculateAge(date_of_birth);
    req.userAge = age;
    req.userIsAdult = age !== null && age >= 18 && is_verified === true;
    return next();
  } catch (err) {
    console.error('Age gating error', err);
    req.userAge = null;
    req.userIsAdult = false;
    return next();
  }
};

module.exports = { checkAgeForAdultContent };
