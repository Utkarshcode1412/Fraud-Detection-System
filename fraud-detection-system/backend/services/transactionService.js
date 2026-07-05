/**
 * transactionService.js
 * -----------------------
 * This is the heart of the whole system -- the API_FLOW described in the
 * spec:  React -> Node -> Flask -> Prediction -> Save -> Alert -> Response
 *
 * Steps, wrapped in a single DB transaction so a partial failure (e.g.
 * saving the transaction but failing to save its prediction) can never
 * leave the database in an inconsistent state:
 *   1. Insert the raw transaction row
 *   2. Call the Flask ML service with the transaction's feature values
 *   3. Persist the prediction result
 *   4. If risk_score crosses the alert threshold, create an alert
 *   5. Commit and return the full picture to the caller
 */

const db = require('../config/db');
const env = require('../config/env');
const transactionModel = require('../models/transactionModel');
const predictionModel = require('../models/predictionModel');
const alertModel = require('../models/alertModel');
const mlService = require('../services/mlService');
const logger = require('../utils/logger');

function toMlFeatures(tx, txTimestamp) {
  const date = txTimestamp ? new Date(txTimestamp) : new Date();
  return {
    amount: tx.amount,
    hour_of_day: date.getUTCHours(),
    day_of_week: date.getUTCDay(),
    merchant_category: tx.merchantCategory,
    country: tx.country,
    device_type: tx.deviceType,
    is_foreign_transaction: tx.isForeignTransaction ? 1 : 0,
    distance_from_home_km: tx.distanceFromHomeKm || 0,
    num_transactions_last_24h: tx.numTransactionsLast24h || 0,
    avg_transaction_amount_30d: tx.avgTransactionAmount30d || tx.amount,
    account_age_days: tx.accountAgeDays || 0,
    is_new_device: tx.isNewDevice ? 1 : 0,
    card_present: tx.cardPresent !== undefined ? (tx.cardPresent ? 1 : 0) : 1,
  };
}

function priorityFromRiskLevel(riskLevel) {
  return { low: 'low', medium: 'medium', high: 'high', critical: 'critical' }[riskLevel] || 'medium';
}

async function submitTransaction(tx) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Persist the transaction (immutable financial record)
    const savedTx = await transactionModel.create(client, tx);

    // 2. Score it via the Flask ML service (Node is the only caller)
    const features = toMlFeatures(tx, savedTx.transaction_time);
    const prediction = await mlService.getPrediction(features);

    // 3. Persist the prediction, linked 1:1 to the transaction
    const savedPrediction = await predictionModel.create(client, savedTx.transaction_id, prediction);

    // 4. Generate an alert if risk crosses the configured threshold
    let alert = null;
    if (prediction.risk_score >= env.fraudAlertRiskThreshold) {
      alert = await alertModel.create(client, {
        predictionId: savedPrediction.prediction_id,
        transactionId: savedTx.transaction_id,
        priority: priorityFromRiskLevel(prediction.risk_level),
      });
      logger.info(`Alert created for transaction ${savedTx.transaction_id} (risk=${prediction.risk_score})`);
    }

    await client.query('COMMIT');

    return {
      transaction: savedTx,
      prediction: savedPrediction,
      alert,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getTransactionDetail(transactionId) {
  return transactionModel.findById(transactionId);
}

async function listTransactions(filters) {
  return transactionModel.list(filters);
}

module.exports = { submitTransaction, getTransactionDetail, listTransactions, toMlFeatures };
