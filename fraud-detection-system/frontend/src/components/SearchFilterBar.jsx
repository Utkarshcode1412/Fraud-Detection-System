import React from 'react';

const RISK_LEVELS = ['', 'low', 'medium', 'high', 'critical'];

export default function SearchFilterBar({ search, onSearchChange, riskLevel, onRiskLevelChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by customer or merchant..."
          className="w-full bg-surface-raised border border-surface-border rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-ink-faint focus:border-brand outline-none"
        />
      </div>
      <select
        value={riskLevel}
        onChange={(e) => onRiskLevelChange(e.target.value)}
        className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2.5 text-sm text-ink focus:border-brand outline-none"
      >
        <option value="">All risk levels</option>
        {RISK_LEVELS.filter(Boolean).map((r) => (
          <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)} risk</option>
        ))}
      </select>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
