/**
 * auth.js
 * -------
 * JWT verification + role-based access control (RBAC) middleware.
 *
 * authenticate(): verifies the Bearer token and attaches req.admin.
 * authorize(...roles): restricts a route to specific admin roles, e.g.
 *   router.delete('/alerts/:id', authenticate, authorize('admin'), ...)
 *
 * Why JWT over server-side sessions here? The dashboard is a stateless
 * REST API consumed by a SPA -- JWT avoids needing sticky sessions or a
 * shared session store if the backend is ever horizontally scaled.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or malformed Authorization header');
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.admin = decoded; // { adminId, email, role }
    next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.admin) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (!allowedRoles.includes(req.admin.role)) {
    throw new ApiError(403, 'Insufficient permissions for this action');
  }
  next();
};

module.exports = { authenticate, authorize };
