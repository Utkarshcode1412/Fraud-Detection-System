const db = require('../config/db');

async function findById(userId) {
  const { rows } = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function list({ limit = 20, offset = 0 } = {}) {
  const { rows } = await db.query(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return rows;
}

module.exports = { findById, findByEmail, list };
