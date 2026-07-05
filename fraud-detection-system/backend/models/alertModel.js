/**
 * alertModel.js
 * -------------
 * Data-access layer for the `alerts` table -- the analyst investigation
 * queue. Alerts are created (by transactionService) only when a
 * prediction's risk_score crosses env.fraudAlertRiskThreshold; not every
 * prediction becomes an alert.
 */

const db = require('../config/db');

async function create(client, { predictionId, transactionId, priority }) {
  const { rows } = await client.query(
    `INSERT INTO alerts (prediction_id, transaction_id, status, priority)
     VALUES ($1, $2, 'open', $3)
     RETURNING *`,
    [predictionId, transactionId, priority]
  );
  return rows[0];
}

async function listOpen({ limit = 20, offset = 0 } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM v_open_alerts LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function findById(alertId) {
  const { rows } = await db.query(
    `SELECT a.*, t.amount, t.merchant_category, t.country, u.full_name AS user_name,
            p.risk_score, p.risk_level, p.reasons, p.probability
     FROM alerts a
     JOIN transactions t ON t.transaction_id = a.transaction_id
     JOIN fraud_predictions p ON p.prediction_id = a.prediction_id
     JOIN users u ON u.user_id = t.user_id
     WHERE a.alert_id = $1`,
    [alertId]
  );
  return rows[0] || null;
}

async function updateStatus(alertId, { status, analystNotes, assignedAdminId }) {
  const { rows } = await db.query(
    `UPDATE alerts
     SET status = COALESCE($2, status),
         analyst_notes = COALESCE($3, analyst_notes),
         assigned_admin_id = COALESCE($4, assigned_admin_id),
         resolved_at = CASE WHEN $2 IN ('confirmed_fraud', 'false_positive', 'resolved')
                             THEN now() ELSE resolved_at END
     WHERE alert_id = $1
     RETURNING *`,
    [alertId, status, analystNotes, assignedAdminId]
  );
  return rows[0] || null;
}

async function assign(alertId, adminId) {
  const { rows } = await db.query(
    `UPDATE alerts SET assigned_admin_id = $2, status = 'investigating'
     WHERE alert_id = $1 RETURNING *`,
    [alertId, adminId]
  );
  return rows[0] || null;
}

module.exports = { create, listOpen, findById, updateStatus, assign };
