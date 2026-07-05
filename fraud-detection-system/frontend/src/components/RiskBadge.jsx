import React from 'react';

const STYLES = {
  low: 'bg-signal-low/15 text-signal-low border-signal-low/30',
  medium: 'bg-signal-medium/15 text-signal-medium border-signal-medium/30',
  high: 'bg-signal-high/15 text-signal-high border-signal-high/30',
  critical: 'bg-signal-critical/15 text-signal-critical border-signal-critical/30',
};

export default function RiskBadge({ level, score }) {
  const style = STYLES[level] || STYLES.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium uppercase tracking-wide ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
