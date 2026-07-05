import React from 'react';
import RiskBadge from './RiskBadge';

function formatAmount(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TransactionTable({ transactions, onRowClick }) {
  if (!transactions?.length) {
    return (
      <div className="py-16 text-center text-ink-muted text-sm">
        No transactions match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint border-b border-surface-border">
            <th className="py-2.5 pr-4 font-medium">Customer</th>
            <th className="py-2.5 pr-4 font-medium">Merchant</th>
            <th className="py-2.5 pr-4 font-medium">Amount</th>
            <th className="py-2.5 pr-4 font-medium">Country</th>
            <th className="py-2.5 pr-4 font-medium">Risk</th>
            <th className="py-2.5 pr-4 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.transaction_id}
              onClick={() => onRowClick?.(tx)}
              className="border-b border-surface-border/60 hover:bg-surface-overlay cursor-pointer transition-colors"
            >
              <td className="py-3 pr-4">
                <div className="font-medium text-ink">{tx.user_name}</div>
                <div className="text-xs text-ink-faint">{tx.user_email}</div>
              </td>
              <td className="py-3 pr-4 text-ink-muted">{tx.merchant_name || tx.merchant_category}</td>
              <td className="py-3 pr-4 font-mono font-tabular">{formatAmount(tx.amount, tx.currency)}</td>
              <td className="py-3 pr-4 text-ink-muted font-mono">{tx.country}</td>
              <td className="py-3 pr-4">
                <RiskBadge level={tx.risk_level || 'low'} score={tx.risk_score} />
              </td>
              <td className="py-3 pr-4 text-ink-faint text-xs font-mono">{formatTime(tx.transaction_time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
