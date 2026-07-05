const express = require('express');
const { body, param, query } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate); // every transaction route requires a logged-in analyst

router.post(
  '/',
  validate([
    body('userId').isUUID().withMessage('Valid userId (UUID) required'),
    body('amount').isFloat({ min: 0 }).withMessage('amount must be a non-negative number'),
    body('merchantCategory').isString().notEmpty(),
    body('country').isString().isLength({ min: 2, max: 2 }),
    body('deviceType').isString().notEmpty(),
  ]),
  transactionController.submitTransaction
);

router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
  ]),
  transactionController.listTransactions
);

router.get(
  '/:id',
  validate([param('id').isUUID()]),
  transactionController.getTransaction
);

module.exports = router;
