const asyncHandler = require('../utils/asyncHandler');
const alertService = require('../services/alertService');

const listAlerts = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
  const alerts = await alertService.listOpenAlerts({ limit, offset });
  res.status(200).json({ data: alerts });
});

const getAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.getAlert(req.params.id);
  res.status(200).json(alert);
});

const assignAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.assignAlert(req.params.id, req.admin.adminId);
  res.status(200).json(alert);
});

const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status, analystNotes } = req.body;
  const alert = await alertService.updateAlertStatus(req.params.id, {
    status, analystNotes, assignedAdminId: req.admin.adminId,
  });
  res.status(200).json(alert);
});

module.exports = { listAlerts, getAlert, assignAlert, updateAlertStatus };
