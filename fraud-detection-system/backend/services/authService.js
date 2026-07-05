/**
 * authService.js
 * --------------
 * Admin login/auth business logic, separated from the HTTP layer
 * (controllers/authController.js) so it's unit-testable without mocking
 * req/res, and reusable if we ever add a second entrypoint (e.g. a CLI
 * admin tool).
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const adminModel = require('../models/adminModel');

async function login(email, password) {
  const admin = await adminModel.findByEmail(email);

  // Deliberately vague error message (don't reveal whether the email
  // exists) -- prevents user enumeration attacks.
  if (!admin || !admin.is_active) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  await adminModel.updateLastLogin(admin.admin_id);

  const token = jwt.sign(
    { adminId: admin.admin_id, email: admin.email, role: admin.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    admin: {
      adminId: admin.admin_id,
      fullName: admin.full_name,
      email: admin.email,
      role: admin.role,
    },
  };
}

async function getProfile(adminId) {
  const admin = await adminModel.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  const { password_hash, ...safe } = admin;
  return safe;
}

module.exports = { login, getProfile };
