/**
 * validate.js
 * -----------
 * Runs an array of express-validator checks, then short-circuits with a
 * 400 if any failed. Keeps validation RULES declared next to the route
 * (routes/*.js) while keeping the CHECKING logic in one reusable place.
 */

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  throw new ApiError(400, 'Validation failed', errors.array());
};

module.exports = validate;
