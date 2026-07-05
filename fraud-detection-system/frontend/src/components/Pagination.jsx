import React from 'react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const go = (p) => onChange(Math.min(Math.max(p, 1), totalPages));

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm">
      <span className="text-ink-muted font-mono text-xs">
        page {page} of {totalPages}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-surface-border text-xs text-ink-muted hover:text-ink hover:border-ink-faint disabled:opacity-30 disabled:hover:text-ink-muted transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-md border border-surface-border text-xs text-ink-muted hover:text-ink hover:border-ink-faint disabled:opacity-30 disabled:hover:text-ink-muted transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
