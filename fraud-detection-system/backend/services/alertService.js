/**
 * alertService.js
 * -----------------
 * Business logic for the analyst investigation workflow: viewing the
 * alert queue, assigning alerts to analysts, and transitioning an
 * alert's status (open -> investigating -> confirmed_fraud/false_positive).
 */

const ApiError = require('../utils/ApiError');
const alertModel = require('../models/alertModel');

const VALID_STATUSES = ['open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved'];

async function listOpenAlerts(pagination) {
  return alertModel.listOpen(pagination);
}

async function getAlert(alertId) {
  const alert = await alertModel.findById(alertId);
  if (!alert) throw new ApiError(404, 'Alert not found');
  return alert;
}

async function assignAlert(alertId, adminId) {
  const alert = await alertModel.assign(alertId, adminId);
  if (!alert) throw new ApiError(404, 'Alert not found');
  return alert;
}

async function updateAlertStatus(alertId, { status, analystNotes, assignedAdminId }) {
  if (status && !VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  const alert = await alertModel.updateStatus(alertId, { status, analystNotes, assignedAdminId });
  if (!alert) throw new ApiError(404, 'Alert not found');
  return alert;
}

module.exports = { listOpenAlerts, getAlert, assignAlert, updateAlertStatus };
