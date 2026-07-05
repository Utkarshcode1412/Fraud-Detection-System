/**
 * adminModel.js
 * -------------
 * Data-access layer for the `admins` table. We use raw parameterized SQL
 * (via pg) rather than an ORM -- for a project this size, an ORM adds an
 * abstraction layer without much payoff, and raw SQL keeps the queries in
 * database/03_useful_queries.sql directly reusable/portable.
 * All queries use $1, $2... placeholders -- never string concatenation --
 * to prevent SQL injection.
 */

const db = require('../config/db');

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(adminId) {
  const { rows } = await db.query('SELECT * FROM admins WHERE admin_id = $1', [adminId]);
  return rows[0] || null;
}

async function updateLastLogin(adminId) {
  await db.query('UPDATE admins SET last_login_at = now() WHERE admin_id = $1', [adminId]);
}

async function listAnalystWorkload() {
  const { rows } = await db.query(`
    SELECT
      ad.admin_id, ad.full_name,
      COUNT(*) FILTER (WHERE a.status = 'open') AS open_count,
      COUNT(*) FILTER (WHERE a.status = 'investigating') AS investigating_count
    FROM admins ad
    LEFT JOIN alerts a ON a.assigned_admin_id = ad.admin_id
    GROUP BY ad.admin_id, ad.full_name
  `);
  return rows;
}

module.exports = { findByEmail, findById, updateLastLogin, listAnalystWorkload };
