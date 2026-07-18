AI-Powered Fraud Detection System
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
Project layout
```
fraud-detection-system/
├── ml-service/         # Python ML pipeline + Flask API
│   ├── ml/              # train.py, predict.py, preprocess.py, etc.
│   ├── routes/           # Flask blueprints
│   ├── services/          # prediction\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_service.py
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
Quick start
1. Machine learning pipeline
```bash
cd ml-service
pip install -r requirements.txt
python3 data/generate\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_data.py     # generates synthetic transactions.csv
python3 -m ml.train                # trains models, writes artifacts/ + reports/
```

2. Flask ML service
```bash
cd ml-service
cp .env.example .env
python3 app.py       # runs on http://localhost:5001
```

3. PostgreSQL database
```bash
createdb fraud\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_detection
psql fraud\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_detection -f database/01\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_schema.sql
psql fraud\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_detection -f database/02\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_views.sql
psql fraud\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_detection -f database/04\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_seed.sql
```
4. Node.js backend
```bash
cd backend
cp .env.example .env      # fill in your DB credentials + ML\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SERVICE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_KEY
npm install
npm run dev                 # runs on http://localhost:5000
```
5. React frontend
```bash
cd frontend
cp .env
npm install
npm run dev                 # runs on http://localhost:5173
```
