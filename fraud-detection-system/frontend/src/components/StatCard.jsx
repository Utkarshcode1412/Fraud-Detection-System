import React from 'react';

export default function StatCard({ label, value, delta, deltaTone = 'safe', suffix = '' }) {
  const toneClass = {
    safe: 'text-signal-safe',
    critical: 'text-signal-critical',
    neutral: 'text-ink-muted',
  }[deltaTone];

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-5 shadow-card">
      <div className="text-xs text-ink-muted font-medium">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono font-tabular text-2xl font-semibold text-ink">{value}{suffix}</span>
        {delta && <span className={`text-xs font-mono ${toneClass}`}>{delta}</span>}
      </div>
    </div>
  );
}
