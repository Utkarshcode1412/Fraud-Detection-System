const db = require('../config/db');

async function create(client, transactionId, prediction) {
  const { rows } = await client.query(
    `INSERT INTO fraud_predictions
      (transaction_id, is_fraud, probability, anomaly_score, risk_score,
       risk_level, confidence, reasons, model_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      transactionId, prediction.is_fraud, prediction.probability, prediction.anomaly_score,
      prediction.risk_score, prediction.risk_level, prediction.confidence,
      JSON.stringify(prediction.reasons), prediction.model_version,
    ]
  );
  return rows[0];
}

module.exports = { create };
