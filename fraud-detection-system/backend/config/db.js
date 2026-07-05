/**
 * db.js
 * -----
 * A single shared `pg` connection Pool for the whole app. Pools reuse
 * connections instead of opening a new TCP/TLS handshake per query --
 * critical for throughput under real load.
 *
 * We export a `query()` helper (rather than exposing the pool directly
 * everywhere) so we can centrally log slow queries and, later, add
 * tracing/metrics in one place.
 */


const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error(`Unexpected PostgreSQL pool error: ${err.message}`);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    logger.warn(`Slow query (${duration}ms): ${text.slice(0, 120)}`);
  }
  return result;
}

pool.connect()
  .then(() => console.log("✅ Connected to Neon PostgreSQL"))
  .catch(err => console.error("❌ Connection Failed:", err.message));

async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };