import React from 'react';
import RiskBadge from './RiskBadge';

export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;
  const reasons = Array.isArray(transaction.reasons)
    ? transaction.reasons
    : (typeof transaction.reasons === 'string' ? JSON.parse(transaction.reasons) : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-surface-raised border border-surface-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h3 className="font-display font-semibold">Transaction detail</h3>
            <p className="text-xs text-ink-faint font-mono mt-0.5">{transaction.transaction_id}</p>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <RiskBadge level={transaction.risk_level || 'low'} score={transaction.risk_score} />
            <span className="font-mono font-tabular text-xl font-semibold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency || 'USD' }).format(transaction.amount)}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="Customer" value={transaction.user_name} />
            <Field label="Email" value={transaction.user_email} />
            <Field label="Merchant" value={transaction.merchant_name || transaction.merchant_category} />
            <Field label="Country" value={transaction.country} />
            <Field label="Device" value={transaction.device_type} />
            <Field label="Card present" value={transaction.card_present ? 'Yes' : 'No'} />
            <Field label="Fraud probability" value={`${(transaction.probability * 100).toFixed(1)}%`} />
            <Field label="Model confidence" value={`${(transaction.confidence * 100).toFixed(1)}%`} />
          </dl>

          {reasons.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide text-ink-faint font-medium mb-2">
                Why this was flagged
              </h4>
              <ul className="space-y-1.5">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-signal-medium shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-faint uppercase tracking-wide">{label}</dt>
      <dd className="text-ink mt-0.5">{value ?? '—'}</dd>
    </div>
  );
}
