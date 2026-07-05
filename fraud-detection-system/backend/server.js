/**
 * server.js
 * ---------
 * Binds the Express app to a port. Separate from app.js so tests can
 * import the app without starting a real listener.
 */

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(env.port, () => {
  logger.info(`Fraud Detection API listening on port ${env.port} [${env.nodeEnv}]`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.stack || err}`);
  server.close(() => process.exit(1));
});
