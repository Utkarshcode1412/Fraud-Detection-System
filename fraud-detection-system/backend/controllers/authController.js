const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json(result);
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.admin.adminId);
  res.status(200).json(profile);
});

module.exports = { login, me };
