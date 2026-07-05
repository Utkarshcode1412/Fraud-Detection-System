import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { admin } = useAuth();

  return (
    <Layout title="Settings" subtitle="Account and system configuration">
      <div className="max-w-xl space-y-6">
        <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-medium mb-4">Profile</h3>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink-faint">Name</dt>
            <dd>{admin?.fullName}</dd>
            <dt className="text-ink-faint">Email</dt>
            <dd>{admin?.email}</dd>
            <dt className="text-ink-faint">Role</dt>
            <dd className="capitalize">{admin?.role?.replace('_', ' ')}</dd>
          </dl>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-medium mb-4">Alerting</h3>
          <p className="text-sm text-ink-muted">
            Alerts are automatically generated when a transaction's blended risk score crosses the
            configured threshold (default: 60/100). This is set via the{' '}
            <code className="text-xs bg-surface px-1.5 py-0.5 rounded font-mono">FRAUD_ALERT_RISK_THRESHOLD</code>{' '}
            environment variable on the backend.
          </p>
        </div>

        <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-medium mb-4">System</h3>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink-faint">ML model</dt>
            <dd className="font-mono">XGBoost + Isolation Forest v1.0.0</dd>
            <dt className="text-ink-faint">Architecture</dt>
            <dd>React → Node.js → Flask → PostgreSQL</dd>
          </dl>
        </div>
      </div>
    </Layout>
  );
}
