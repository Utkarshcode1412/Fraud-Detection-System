import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import FraudTrendChart from '../components/FraudTrendChart';
import RiskDistributionChart from '../components/RiskDistributionChart';
import TopLocationsChart from '../components/TopLocationsChart';
import TransactionTable from '../components/TransactionTable';
import TransactionDetailModal from '../components/TransactionDetailModal';
import RiskBadge from '../components/RiskBadge';
import { dashboardApi } from '../api/endpoints';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    dashboardApi.overview()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'));
  }, []);

  return (
    <Layout title="Dashboard" subtitle="Real-time fraud detection overview">
      {error && <ErrorBanner message={error} />}

      {!data && !error && <LoadingState />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total transactions" value={Number(data.summary.total_transactions).toLocaleString()} />
            <StatCard label="Fraud transactions" value={Number(data.summary.fraud_transactions).toLocaleString()} deltaTone="critical" delta={`${data.summary.fraud_rate_pct}% rate`} />
            <StatCard label="Safe transactions" value={Number(data.summary.safe_transactions).toLocaleString()} deltaTone="safe" delta="cleared" />
            <StatCard label="Fraud rate" value={data.summary.fraud_rate_pct} suffix="%" deltaTone="neutral" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Fraud trend (30d)" className="lg:col-span-2">
              <FraudTrendChart data={data.fraudTrend} />
            </Panel>
            <Panel title="Risk distribution">
              <RiskDistributionChart data={data.riskDistribution} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Top fraud locations" className="lg:col-span-1">
              <TopLocationsChart data={data.topFraudLocations} />
            </Panel>

            <Panel title="Recent alerts" className="lg:col-span-2">
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
                {data.recentAlerts?.length ? data.recentAlerts.map((a) => (
                  <div key={a.alert_id} className="flex items-center justify-between text-sm py-2 border-b border-surface-border/60 last:border-0">
                    <div>
                      <div className="font-medium">{a.user_name}</div>
                      <div className="text-xs text-ink-faint">{a.merchant_category} · {a.country}</div>
                    </div>
                    <RiskBadge level={a.risk_level} score={a.risk_score} />
                  </div>
                )) : <EmptyRow text="No open alerts right now." />}
              </div>
            </Panel>
          </div>

          <Panel title="Recent transactions">
            <TransactionTable transactions={data.recentTransactions} onRowClick={setSelectedTx} />
          </Panel>
        </div>
      )}

      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </Layout>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card ${className}`}>
      <h3 className="text-sm font-medium text-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="mb-4 bg-signal-critical/10 border border-signal-critical/30 text-signal-critical text-sm rounded-lg px-4 py-3">
      {message}
    </div>
  );
}

function LoadingState() {
  return <div className="text-ink-muted text-sm py-16 text-center">Loading dashboard…</div>;
}

function EmptyRow({ text }) {
  return <p className="text-ink-faint text-sm py-6 text-center">{text}</p>;
}
