const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  authController.login
);

router.get('/me', authenticate, authController.me);

module.exports = router;
