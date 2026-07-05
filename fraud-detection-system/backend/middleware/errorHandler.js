/**
 * errorHandler.js
 * ---------------
 * Centralized error-handling middleware (must be registered LAST in
 * app.js, after all routes). Every controller can simply `throw` an
 * ApiError (or let a promise reject) and it lands here exactly once --
 * no repeated try/catch/res.status boilerplate in every route.
 */

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
