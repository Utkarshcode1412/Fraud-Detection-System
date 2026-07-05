/**
 * transactionModel.js
 * --------------------
 * Data-access layer for transactions + the joined view used by the
 * dashboard/transactions list.
 */

const db = require('../config/db');

async function create(client, tx) {
  const { rows } = await client.query(
    `INSERT INTO transactions
      (user_id, amount, currency, merchant_name, merchant_category, country,
       device_type, ip_address, latitude, longitude, distance_from_home_km,
       is_foreign_transaction, is_new_device, card_present, transaction_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, COALESCE($15, now()))
     RETURNING *`,
    [
      tx.userId, tx.amount, tx.currency || 'USD', tx.merchantName, tx.merchantCategory,
      tx.country, tx.deviceType, tx.ipAddress || null, tx.latitude || null, tx.longitude || null,
      tx.distanceFromHomeKm || 0, tx.isForeignTransaction || false, tx.isNewDevice || false,
      tx.cardPresent !== undefined ? tx.cardPresent : true, tx.transactionTime || null,
    ]
  );
  return rows[0];
}

async function findById(transactionId) {
  const { rows } = await db.query(
    'SELECT * FROM v_transaction_details WHERE transaction_id = $1',
    [transactionId]
  );
  return rows[0] || null;
}

async function list({ limit = 20, offset = 0, riskLevel = null, minAmount = null, maxAmount = null, search = null }) {
  const { rows } = await db.query(
    `SELECT * FROM v_transaction_details
     WHERE ($1::varchar IS NULL OR risk_level = $1)
       AND ($2::decimal IS NULL OR amount >= $2)
       AND ($3::decimal IS NULL OR amount <= $3)
       AND ($4::text IS NULL OR user_name ILIKE '%' || $4 || '%' OR merchant_name ILIKE '%' || $4 || '%')
     ORDER BY transaction_time DESC
     LIMIT $5 OFFSET $6`,
    [riskLevel, minAmount, maxAmount, search, limit, offset]
  );

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM v_transaction_details
     WHERE ($1::varchar IS NULL OR risk_level = $1)
       AND ($2::decimal IS NULL OR amount >= $2)
       AND ($3::decimal IS NULL OR amount <= $3)
       AND ($4::text IS NULL OR user_name ILIKE '%' || $4 || '%' OR merchant_name ILIKE '%' || $4 || '%')`,
    [riskLevel, minAmount, maxAmount, search]
  );

  return { rows, total: countRows[0].total };
}

async function forUser(userId) {
  const { rows } = await db.query(
    'SELECT * FROM v_transaction_details WHERE user_id = $1 ORDER BY transaction_time DESC',
    [userId]
  );
  return rows;
}

module.exports = { create, findById, list, forUser };
