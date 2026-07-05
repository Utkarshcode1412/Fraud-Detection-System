# Sentry — AI-Powered Fraud Detection System

A full-stack fraud detection platform built for a fintech-style environment:
a React analyst dashboard, a Node.js/Express API, a Python/Flask ML
microservice serving an XGBoost + Isolation Forest ensemble, and a
normalized PostgreSQL database.

```
React Dashboard  →  Node.js/Express API  →  PostgreSQL
                            ↓
                     Flask ML Service
                            ↓
              XGBoost + Isolation Forest
```

**The frontend never calls Flask directly — only Node.js does.** This keeps
the ML service as an internal implementation detail the browser can't reach,
and gives Node one place to authenticate, log, and persist every prediction.

See `docs/EXPLANATION.md` for a full walkthrough of every function and the
end-to-end data flow, and `docs/INTERVIEW_QUESTIONS.md` for the interview
questions this project is designed to prepare you for.

---

## Project layout

```
fraud-detection-system/
├── ml-service/         # Python ML pipeline + Flask API
│   ├── ml/              # train.py, predict.py, preprocess.py, etc.
│   ├── routes/           # Flask blueprints
│   ├── services/          # prediction_service.py
│   ├── utils/              # validators.py
│   ├── data/                 # synthetic dataset + generator
│   ├── artifacts/              # trained model/scaler/encoder (generated)
│   └── reports/                  # ROC curve, confusion matrix, metrics.json
├── backend/              # Node.js/Express MVC API
│   ├── controllers/ routes/ middleware/ services/ models/ config/ utils/
├── frontend/             # React + Vite + Tailwind dashboard
│   └── src/{pages,components,api,context}/
├── database/              # PostgreSQL schema, views, seed data
└── docs/                    # Written explanations + interview prep
```

---

## Quick start

### 1. Machine learning pipeline

```bash
cd ml-service
pip install -r requirements.txt
python3 data/generate_data.py     # generates synthetic transactions.csv
python3 -m ml.train                # trains models, writes artifacts/ + reports/
```

This produces `artifacts/xgb_model.joblib`, `isolation_forest.joblib`,
`scaler.joblib`, `encoder.joblib`, `feature_columns.joblib`, `metadata.joblib`,
plus `reports/roc_curve.png`, `confusion_matrix.png`, `feature_importance.png`,
and `metrics.json`.

### 2. Flask ML service

```bash
cd ml-service
cp .env.example .env
python3 app.py       # runs on http://localhost:5001
```

Verify it's alive: `curl http://localhost:5001/health`

### 3. PostgreSQL database

```bash
createdb fraud_detection
psql fraud_detection -f database/01_schema.sql
psql fraud_detection -f database/02_views.sql
psql fraud_detection -f database/04_seed.sql
```

### 4. Node.js backend

```bash
cd backend
cp .env.example .env      # fill in your DB credentials + ML_SERVICE_API_KEY
npm install
npm run dev                 # runs on http://localhost:5000
```

### 5. React frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # runs on http://localhost:5173
```

**Demo login:** `analyst@frauddetect.dev` / `Admin123!` (seeded in
`database/04_seed.sql`).

---

## What each layer actually does

- **ML pipeline (`ml-service/ml/`)** — trains an XGBoost classifier
  (supervised, learns from labeled fraud) blended with an Isolation Forest
  (unsupervised, catches novel anomalies), and exposes both through a single
  `predict_single()` call that returns a 0–100 risk score, a risk level, a
  confidence value, and a list of plain-English reasons.
- **Flask service (`ml-service/app.py`)** — a thin, validated HTTP wrapper
  around the ML pipeline. Loads models once at startup, not per-request.
- **Node backend (`backend/`)** — MVC architecture: routes → controllers →
  services → models (data access). Owns authentication (JWT + bcrypt +
  role-based access control), talks to Postgres, and is the only service
  allowed to call Flask. `transactionService.submitTransaction()` is the
  core orchestration: insert transaction → call ML service → save
  prediction → generate an alert if risk crosses a threshold — all inside
  one DB transaction.
- **PostgreSQL (`database/`)** — five normalized tables (`users`, `admins`,
  `transactions`, `fraud_predictions`, `alerts`) plus views that back every
  dashboard chart directly, so aggregation logic lives in the database, not
  duplicated across backend endpoints.
- **React dashboard (`frontend/`)** — a dark, data-dense "security ops
  console" aesthetic (deliberately not a generic consumer banking UI —
  analysts scan this for hours). Pages: Dashboard, Transactions, Analytics,
  Alerts (investigation workflow with assign/status transitions and
  role-gated resolution), Settings.

## A note on the synthetic data

`ml-service/data/generate_data.py` generates 20,000 synthetic transactions
with fraud deliberately made statistically distinct (unusual hours, higher
amounts, foreign transactions, new devices) so the pipeline has a clear
signal to learn from. This makes the demo model's ROC-AUC land near-perfect
— real fraud data is far messier (AUC in production fraud systems typically
lands around 0.85–0.97). Mention this trade-off explicitly in interviews —
it shows you understand the difference between a clean pipeline
demonstration and a model that would survive contact with real, adversarial
data.
