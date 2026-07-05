/**
 * app.js
 * ------
 * Express app composition root: wires up security middleware, routes,
 * and error handling. Kept separate from server.js so the app object
 * can be imported directly in tests (supertest) without binding a port.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const mlService = require('./services/mlService');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();

// ---- Security & parsing middleware -------------------------------
app.use(helmet());
app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Basic rate limiting on the whole API -- protects against brute-force
// login attempts and naive scraping. A real fintech deployment would
// layer a WAF/API gateway in front of this too.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- Routes ---------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ service: 'Fraud Detection API', status: 'running' });
});

app.get('/health', async (req, res) => {
  const mlHealthy = await mlService.checkHealth();
  res.json({
    status: 'healthy',
    dependencies: { mlService: mlHealthy ? 'up' : 'down' },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);

// ---- 404 + centralized error handling (must be registered LAST) -----
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
