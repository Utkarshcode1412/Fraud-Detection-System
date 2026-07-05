/**
 * asyncHandler.js
 * ----------------
 * Wraps an async Express route handler so any rejected promise is
 * forwarded to next(err) automatically. Without this, an unhandled
 * rejection inside an async controller crashes the process instead of
 * being caught by errorHandler.js.
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
