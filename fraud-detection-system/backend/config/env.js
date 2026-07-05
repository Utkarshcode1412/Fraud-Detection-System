/**
 * env.js
 * -------
 * Centralized, validated environment configuration. Every other module
 * imports from HERE instead of calling process.env directly -- this
 * means a typo'd env var name fails loudly at startup instead of
 * silently returning `undefined` deep inside a controller at 2am.
 */

require('dotenv').config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  db: {
    host: required('DB_HOST', 'localhost'),
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: required('DB_NAME', 'fraud_detection'),
    user: required('DB_USER', 'postgres'),
    password: required('DB_PASSWORD', 'postgres'),
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  mlService: {
    url: required('ML_SERVICE_URL', 'http://localhost:5001'),
    apiKey: required('ML_SERVICE_API_KEY', 'dev-internal-key-change-me'),
  },

  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',

  fraudAlertRiskThreshold: parseFloat(process.env.FRAUD_ALERT_RISK_THRESHOLD || '60'),
};

module.exports = env;
