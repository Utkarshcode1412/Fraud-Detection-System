import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import { alertsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved'];

export default function Alerts() {
  const { admin } = useAuth();
  const canResolve = admin?.role === 'senior_analyst' || admin?.role === 'admin';
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    alertsApi.list({ pageSize: 30 })
      .then((res) => setAlerts(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignToMe = async (alertId) => {
    await alertsApi.assign(alertId);
    load();
  };

  const updateStatus = async (alertId, status) => {
    await alertsApi.updateStatus(alertId, { status, analystNotes: notesDraft || undefined });
    setNotesDraft('');
    setExpanded(null);
    load();
  };

  return (
    <Layout title="Alerts" subtitle="Investigation queue for flagged transactions">
      {loading && <div className="text-ink-muted text-sm py-16 text-center">Loading alerts…</div>}

      {!loading && alerts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-ink-muted text-sm">No open alerts. Queue is clear.</p>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((a) => {
          const isOpen = expanded === a.alert_id;
          const reasons = Array.isArray(a.reasons) ? a.reasons : (a.reasons ? JSON.parse(a.reasons) : []);
          return (
            <div key={a.alert_id} className="bg-surface-raised border border-surface-border rounded-xl shadow-card overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : a.alert_id)}
              >
                <div className="flex items-center gap-4">
                  <RiskBadge level={a.risk_level} score={a.risk_score} />
                  <div>
                    <div className="font-medium text-sm">{a.user_name}</div>
                    <div className="text-xs text-ink-faint">{a.merchant_category} · {a.country} · ${Number(a.amount).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={a.status} />
                  <span className="text-xs text-ink-faint font-mono">{a.assigned_to || 'unassigned'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-surface-border pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wide text-ink-faint mb-2">Why this was flagged</h4>
                    <ul className="space-y-1">
                      {reasons.map((r, i) => (
                        <li key={i} className="text-sm text-ink-muted flex gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-signal-medium shrink-0" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Analyst notes…"
                    rows={2}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder:text-ink-faint focus:border-brand outline-none"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => assignToMe(a.alert_id)} className="px-3 py-1.5 rounded-md border border-surface-border text-xs hover:border-brand hover:text-brand transition-colors">
                      Assign to me
                    </button>
                    <button onClick={() => updateStatus(a.alert_id, 'investigating')} className="px-3 py-1.5 rounded-md border border-surface-border text-xs hover:border-signal-medium hover:text-signal-medium transition-colors">
                      Mark investigating
                    </button>
                    {canResolve && (
                      <>
                        <button onClick={() => updateStatus(a.alert_id, 'confirmed_fraud')} className="px-3 py-1.5 rounded-md border border-signal-critical/40 text-signal-critical text-xs hover:bg-signal-critical/10 transition-colors">
                          Confirm fraud
                        </button>
                        <button onClick={() => updateStatus(a.alert_id, 'false_positive')} className="px-3 py-1.5 rounded-md border border-signal-safe/40 text-signal-safe text-xs hover:bg-signal-safe/10 transition-colors">
                          Mark false positive
                        </button>
                      </>
                    )}
                  </div>
                  {!canResolve && (
                    <p className="text-[11px] text-ink-faint">Only senior analysts can confirm fraud or close alerts.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

function StatusPill({ status }) {
  const label = status.replace('_', ' ');
  const color = {
    open: 'text-signal-medium',
    investigating: 'text-signal-low',
    confirmed_fraud: 'text-signal-critical',
    false_positive: 'text-signal-safe',
    resolved: 'text-ink-muted',
  }[status] || 'text-ink-muted';
  return <span className={`text-xs font-mono capitalize ${color}`}>{label}</span>;
}
