/**
 * mlService.js
 * ------------
 * The ONLY module in the whole backend allowed to talk to Flask.
 * Everything else (controllers) calls THIS module, never axios/Flask
 * directly -- so if the ML service's contract changes, there's exactly
 * one place to update, and it's trivial to add caching/circuit-breaking
 * here later without touching controllers.
 */

const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const client = axios.create({
  baseURL: env.mlService.url,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Api-Key': env.mlService.apiKey,
  },
});

async function getPrediction(transactionFeatures) {
  try {
    const { data } = await client.post('/predict', transactionFeatures);
    return data;
  } catch (err) {
    if (err.response) {
      // Flask responded with an error status (validation, etc.)
      logger.error(`ML service rejected request: ${JSON.stringify(err.response.data)}`);
      throw new ApiError(err.response.status, err.response.data.error || 'ML service error');
    }
    // Network failure, timeout, service down, etc.
    logger.error(`ML service unreachable: ${err.message}`);
    throw new ApiError(503, 'Fraud detection service is currently unavailable');
  }
}

async function getModelInfo() {
  try {
    const { data } = await client.get('/model-info');
    return data;
  } catch (err) {
    logger.error(`Failed to fetch model info: ${err.message}`);
    throw new ApiError(503, 'Could not retrieve model info');
  }
}

async function checkHealth() {
  try {
    await client.get('/health', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = { getPrediction, getModelInfo, checkHealth };
