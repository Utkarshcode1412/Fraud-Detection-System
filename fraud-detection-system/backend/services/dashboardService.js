/**
 * dashboardService.js
 * ---------------------
 * Aggregation queries backing the dashboard's stat cards + charts. Reads
 * from the SQL views in database/02_views.sql rather than re-deriving
 * aggregation logic in JS -- the database is much better at GROUP BY /
 * window functions over large tables than pulling rows into Node and
 * aggregating in application code.
 */

const db = require('../config/db');

async function getSummary() {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) AS total_transactions,
      COUNT(*) FILTER (WHERE p.is_fraud) AS fraud_transactions,
      COUNT(*) FILTER (WHERE NOT p.is_fraud) AS safe_transactions,
      ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_fraud) / NULLIF(COUNT(*), 0), 2) AS fraud_rate_pct
    FROM transactions t
    LEFT JOIN fraud_predictions p ON p.transaction_id = t.transaction_id
  `);
  return rows[0];
}

async function getFraudTrend(days = 30) {
  const { rows } = await db.query(
    `SELECT * FROM v_daily_fraud_trend WHERE day >= (CURRENT_DATE - $1::int) ORDER BY day`,
    [days]
  );
  return rows;
}

async function getRiskDistribution() {
  const { rows } = await db.query('SELECT * FROM v_risk_distribution');
  return rows;
}

async function getTopFraudLocations(limit = 10) {
  const { rows } = await db.query('SELECT * FROM v_top_fraud_locations LIMIT $1', [limit]);
  return rows;
}

async function getRecentTransactions(limit = 10) {
  const { rows } = await db.query(
    'SELECT * FROM v_transaction_details ORDER BY transaction_time DESC LIMIT $1',
    [limit]
  );
  return rows;
}

async function getRecentAlerts(limit = 10) {
  const { rows } = await db.query('SELECT * FROM v_open_alerts LIMIT $1', [limit]);
  return rows;
}

module.exports = {
  getSummary,
  getFraudTrend,
  getRiskDistribution,
  getTopFraudLocations,
  getRecentTransactions,
  getRecentAlerts,
};
