"""
generate_data.py
-----------------
Generates a realistic synthetic credit-card / banking transaction dataset.

In a real fintech company you would NEVER generate fake data like this --
you'd pull from a data warehouse (e.g. Snowflake) or an event stream
(Kafka). This script exists purely so the ML pipeline in this project has
something realistic to train on, with the same *shape* of features you'd
find in a real fraud dataset (amount, merchant category, geo, velocity,
device, time-of-day, etc).

Fraud is deliberately rare (~2.5%) to mirror real-world class imbalance,
which is one of the central challenges in fraud modeling.
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)

N_ROWS = 20000
FRAUD_RATE = 0.025

MERCHANT_CATEGORIES = [
    "grocery", "electronics", "travel", "restaurant", "fuel",
    "online_retail", "utilities", "entertainment", "healthcare", "jewelry"
]

# Categories that fraudsters disproportionately target (higher resale value,
# harder to trace) -- used to bias fraud generation realistically.
HIGH_RISK_CATEGORIES = {"electronics", "jewelry", "online_retail", "travel"}

COUNTRIES = ["US", "GB", "IN", "CA", "AU", "DE", "FR", "NG", "BR", "SG"]
HIGH_RISK_COUNTRIES = {"NG"}  # illustrative only, not a real risk claim

DEVICE_TYPES = ["mobile_app", "web_chrome", "web_safari", "pos_terminal", "atm"]


def generate_dataset(n_rows: int = N_ROWS, fraud_rate: float = FRAUD_RATE) -> pd.DataFrame:
    n_fraud = int(n_rows * fraud_rate)
    n_legit = n_rows - n_fraud

    rows = []
    rows.extend(_generate_legit(n_legit))
    rows.extend(_generate_fraud(n_fraud))

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    df["transaction_id"] = [f"TXN{100000 + i}" for i in range(len(df))]
    return df


def _generate_legit(n):
    out = []
    for _ in range(n):
        hour = RNG.choice(range(24), p=_daytime_bias())
        amount = float(np.round(RNG.gamma(shape=2.0, scale=45.0) + 1, 2))
        category = RNG.choice(MERCHANT_CATEGORIES)
        country = RNG.choice(COUNTRIES, p=_country_bias())
        out.append({
            "amount": amount,
            "hour_of_day": int(hour),
            "day_of_week": int(RNG.integers(0, 7)),
            "merchant_category": category,
            "country": country,
            "device_type": RNG.choice(DEVICE_TYPES, p=[0.45, 0.25, 0.15, 0.1, 0.05]),
            "is_foreign_transaction": int(country != "US"),
            "distance_from_home_km": float(np.round(np.abs(RNG.normal(15, 20)), 2)),
            "num_transactions_last_24h": int(RNG.poisson(2)),
            "avg_transaction_amount_30d": float(np.round(RNG.normal(80, 30), 2)),
            "account_age_days": int(RNG.integers(30, 3000)),
            "is_new_device": int(RNG.random() < 0.05),
            "card_present": int(RNG.random() < 0.6),
            "is_fraud": 0,
        })
    return out


def _generate_fraud(n):
    out = []
    for _ in range(n):
        # Fraud skews to odd hours, high amounts, foreign, high-risk categories
        hour = RNG.choice(range(24), p=_night_bias())
        amount = float(np.round(RNG.gamma(shape=3.0, scale=180.0) + 20, 2))
        category = RNG.choice(list(HIGH_RISK_CATEGORIES) + ["grocery"], p=[0.28, 0.27, 0.27, 0.09, 0.09])
        country = RNG.choice(COUNTRIES + ["NG"] * 3, size=1)[0]
        out.append({
            "amount": amount,
            "hour_of_day": int(hour),
            "day_of_week": int(RNG.integers(0, 7)),
            "merchant_category": category,
            "country": country,
            "device_type": RNG.choice(DEVICE_TYPES, p=[0.35, 0.3, 0.1, 0.05, 0.2]),
            "is_foreign_transaction": int(country != "US"),
            "distance_from_home_km": float(np.round(np.abs(RNG.normal(500, 400)), 2)),
            "num_transactions_last_24h": int(RNG.poisson(7)),
            "avg_transaction_amount_30d": float(np.round(RNG.normal(80, 30), 2)),
            "account_age_days": int(RNG.integers(1, 3000)),
            "is_new_device": int(RNG.random() < 0.55),
            "card_present": int(RNG.random() < 0.15),
            "is_fraud": 1,
        })
    return out


def _daytime_bias():
    # Legit transactions cluster during waking hours
    p = np.array([0.5, 0.4, 0.3, 0.3, 0.3, 0.5, 1, 2, 3, 4, 4.5, 5,
                  5, 4.5, 4, 4, 4.5, 5, 5.5, 5, 4, 3, 2, 1])
    return p / p.sum()


def _night_bias():
    # Fraud clusters late night / early morning
    p = np.array([4, 5, 5.5, 5, 4.5, 3, 2, 1, 1, 1, 1, 1.5,
                  1.5, 1.5, 1.5, 1.5, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 4.5])
    return p / p.sum()


def _country_bias():
    p = np.array([0.55, 0.08, 0.07, 0.07, 0.05, 0.05, 0.05, 0.02, 0.03, 0.03])
    return p / p.sum()


if __name__ == "__main__":
    df = generate_dataset()
    out_path = Path(__file__).parent / "transactions.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
    print(f"Fraud rate: {df['is_fraud'].mean():.4f}")
