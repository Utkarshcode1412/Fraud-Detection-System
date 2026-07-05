-- =====================================================================
-- Useful reference queries (also used directly by backend/models/*.js)
-- =====================================================================

-- 1. Dashboard summary cards (total / fraud / safe / fraud rate)
SELECT
    COUNT(*) AS total_transactions,
    COUNT(*) FILTER (WHERE p.is_fraud) AS fraud_transactions,
    COUNT(*) FILTER (WHERE NOT p.is_fraud) AS safe_transactions,
    ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_fraud) / NULLIF(COUNT(*), 0), 2) AS fraud_rate_pct
FROM transactions t
LEFT JOIN fraud_predictions p ON p.transaction_id = t.transaction_id;

-- 2. Recent transactions (paginated)
SELECT * FROM v_transaction_details
ORDER BY transaction_time DESC
LIMIT 20 OFFSET 0;

-- 3. Recent high-priority alerts
SELECT * FROM v_open_alerts
LIMIT 10;

-- 4. A specific user's transaction history + fraud flags
SELECT * FROM v_transaction_details
WHERE user_id = $1
ORDER BY transaction_time DESC;

-- 5. Analysts' current workload (open alerts assigned per analyst)
SELECT
    ad.full_name,
    COUNT(*) FILTER (WHERE a.status = 'open') AS open_count,
    COUNT(*) FILTER (WHERE a.status = 'investigating') AS investigating_count
FROM admins ad
LEFT JOIN alerts a ON a.assigned_admin_id = ad.admin_id
GROUP BY ad.full_name;

-- 6. Fraud rate by merchant category (identify risky categories)
SELECT
    t.merchant_category,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE p.is_fraud) AS fraud_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_fraud) / NULLIF(COUNT(*), 0), 2) AS fraud_rate_pct
FROM transactions t
JOIN fraud_predictions p ON p.transaction_id = t.transaction_id
GROUP BY t.merchant_category
ORDER BY fraud_rate_pct DESC;

-- 7. Search transactions by amount range + risk level (used by Transactions page filters)
SELECT * FROM v_transaction_details
WHERE amount BETWEEN $1 AND $2
  AND ($3::varchar IS NULL OR risk_level = $3)
ORDER BY transaction_time DESC
LIMIT $4 OFFSET $5;

-- 8. Average time-to-resolution for confirmed fraud alerts (analyst KPI)
SELECT
    ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 2) AS avg_resolution_hours
FROM alerts
WHERE status = 'confirmed_fraud' AND resolved_at IS NOT NULL;
