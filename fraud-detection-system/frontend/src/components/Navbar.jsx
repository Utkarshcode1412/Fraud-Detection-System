import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle }) {
  const { admin, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 border-b border-surface-border flex items-center justify-between px-6 bg-surface/80 backdrop-blur">
      <div>
        <h1 className="font-display font-semibold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-1.5">
          <div className="w-2 h-2 rounded-full bg-signal-safe animate-pulse" />
          <span className="text-xs text-ink-muted font-mono">live</span>
        </div>

        <div className="h-6 w-px bg-surface-border" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-semibold font-mono">
            {admin?.fullName?.slice(0, 2).toUpperCase() || 'AN'}
          </div>
          <div className="text-sm leading-tight">
            <div className="font-medium">{admin?.fullName || 'Analyst'}</div>
            <div className="text-[11px] text-ink-muted capitalize">{admin?.role?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={logout}
            className="ml-2 text-xs text-ink-muted hover:text-ink border border-surface-border hover:border-ink-faint rounded-md px-2.5 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
