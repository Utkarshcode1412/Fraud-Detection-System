const express = require('express');
const { body, param } = require('express-validator');
const alertController = require('../controllers/alertController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', alertController.listAlerts);

router.get('/:id', validate([param('id').isUUID()]), alertController.getAlert);

router.patch(
  '/:id/assign',
  validate([param('id').isUUID()]),
  alertController.assignAlert
);

// Only senior_analyst / admin can close out an alert as confirmed fraud
// or false positive -- a junior analyst can investigate but not resolve.
router.patch(
  '/:id/status',
  validate([
    param('id').isUUID(),
    body('status').isIn(['open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved']),
  ]),
  authorize('senior_analyst', 'admin'),
  alertController.updateAlertStatus
);

module.exports = router;
