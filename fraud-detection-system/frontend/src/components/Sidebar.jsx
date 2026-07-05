import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridIcon },
  { to: '/transactions', label: 'Transactions', icon: ListIcon },
  { to: '/analytics', label: 'Analytics', icon: ChartIcon },
  { to: '/alerts', label: 'Alerts', icon: BellIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-surface-border bg-surface-raised">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-surface-border">
        <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center">
          <ShieldIcon />
        </div>
        <span className="font-display font-semibold tracking-tight text-[15px]">Sentry</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-overlay'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-surface-border text-[11px] text-ink-faint font-mono">
        model v1.0.0 &middot; xgboost + iforest
      </div>
    </aside>
  );
}

function iconProps() {
  return { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 };
}
function ShieldIcon() {
  return (
    <svg {...iconProps()} stroke="white" width={16} height={16}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 19V9M12 19V5M20 19v-7" strokeLinecap="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M9.5 20a2.5 2.5 0 005 0" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a7.9 7.9 0 000-3l2-1.6-2-3.4-2.4.7a8 8 0 00-2.6-1.5L14 2h-4l-.4 2.7a8 8 0 00-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.9 7.9 0 000 3l-2 1.6 2 3.4 2.4-.7a8 8 0 002.6 1.5L10 22h4l.4-2.7a8 8 0 002.6-1.5l2.4.7 2-3.4-2-1.6z" />
    </svg>
  );
}
