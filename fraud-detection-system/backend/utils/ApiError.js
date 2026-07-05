/**
 * ApiError.js
 * -----------
 * A typed error carrying an HTTP status code, so controllers can
 * `throw new ApiError(404, 'Alert not found')` and the centralized
 * error middleware knows exactly what status/body to send -- instead of
 * every controller hand-rolling res.status(x).json(...) error branches.
 */

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
