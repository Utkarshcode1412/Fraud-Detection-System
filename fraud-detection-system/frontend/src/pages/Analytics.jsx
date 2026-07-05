import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import FraudTrendChart from '../components/FraudTrendChart';
import RiskDistributionChart from '../components/RiskDistributionChart';
import TopLocationsChart from '../components/TopLocationsChart';
import StatCard from '../components/StatCard';
import { dashboardApi } from '../api/endpoints';

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.overview().then((res) => setData(res.data)).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <Layout title="Analytics" subtitle="Model performance and fraud pattern insights">
        <div className="text-ink-muted text-sm py-16 text-center">Loading analytics…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics" subtitle="Model performance and fraud pattern insights">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Fraud rate (all time)" value={data.summary.fraud_rate_pct} suffix="%" />
          <StatCard label="Total flagged" value={Number(data.summary.fraud_transactions).toLocaleString()} deltaTone="critical" />
          <StatCard label="Model version" value="v1.0.0" deltaTone="neutral" />
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-medium mb-4">Fraud trend, last 30 days</h3>
          <FraudTrendChart data={data.fraudTrend} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-medium mb-4">Risk score distribution</h3>
            <RiskDistributionChart data={data.riskDistribution} />
          </div>
          <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-medium mb-4">Fraud by location</h3>
            <TopLocationsChart data={data.topFraudLocations} />
          </div>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-medium mb-3">About the model</h3>
          <p className="text-sm text-ink-muted leading-relaxed">
            Predictions blend a supervised XGBoost classifier (trained on labeled historical
            fraud) with an unsupervised Isolation Forest anomaly score, so novel fraud patterns
            that don't match historical labels still raise the blended risk score. Every
            prediction ships with a plain-language explanation of the contributing risk factors,
            visible on any transaction's detail view.
          </p>
        </div>
      </div>
    </Layout>
  );
}
