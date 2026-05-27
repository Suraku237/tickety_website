import { useState, useEffect, useCallback } from 'react';
import DashLayout    from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import { getAnalytics } from '../services/api.service';
import '../styles/analytics.css';

// =============================================================
// ANALYTICS PAGE — dynamic
// =============================================================

const PERIODS = [
  { key: 'week',      label: 'This Week'  },
  { key: 'last_week', label: 'Last Week'  },
  { key: 'month',     label: 'This Month' },
];

const PRIORITY_COLORS = {
  normal: '#666',
  high:   '#F59E0B',
  urgent: '#DC0F0F',
};

export default function AnalyticsPage() {
  const { user } = useSession();

  const [period,   setPeriod]   = useState('week');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    if (!user?.service_id) return;
    setLoading(true); setError('');
    const res = await getAnalytics({ serviceId: user.service_id, period });
    if (res.success) {
      setData(res);
    } else {
      setError(res.message || 'Failed to load analytics.');
    }
    setLoading(false);
  }, [user?.service_id, period]);

  useEffect(() => { load(); }, [load]);

  // ── Derived values ──────────────────────────────────────
  const daily     = data?.daily         || [];
  const prioData  = data?.priority_breakdown || [];
  const queueData = data?.queue_stats   || [];
  const maxCount  = Math.max(...daily.map(d => d.count), 1);

  // SVG Donut
  const total         = data?.total_tickets || 0;
  const R             = 60;
  const circumference = 2 * Math.PI * R;
  let   offset        = 0;
  const donutSlices   = prioData.map(p => {
    const dash  = (p.pct / 100) * circumference;
    const slice = { ...p, dash, gap: circumference - dash, offset };
    offset += dash;
    return slice;
  });

  const kpis = [
    { label: 'Total Tickets',  val: loading ? '…' : (data?.total_tickets ?? 0),   icon: '🎟', col: '#DC0F0F' },
    { label: 'Avg / Day',      val: loading ? '…' : (data?.avg_per_day    ?? '—'), icon: '📅', col: '#3B82F6' },
    { label: 'Avg Wait (min)', val: loading ? '…' : (data?.avg_wait       ?? '—'), icon: '⏱', col: '#F59E0B' },
    { label: 'Peak Day',       val: loading ? '…' : (data?.peak_day       ?? '—'), icon: '📈', col: '#22C55E' },
  ];

  return (
    <DashLayout title="Analytics" subtitle="INSIGHTS">

      {error && (
        <div className="ap-error-banner" onClick={() => setError('')}>⚠ {error}</div>
      )}

      {/* PERIOD SELECTOR */}
      <div className="ap-period-row">
        {PERIODS.map(p => (
          <button key={p.key}
            className={`ap-period-btn ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="ap-kpis">
        {kpis.map(k => (
          <div key={k.label} className="ap-kpi">
            <div className="ap-kpi-icon" style={{ color: k.col, background: k.col + '18' }}>
              {k.icon}
            </div>
            <div className="ap-kpi-val" style={{ color: k.col }}>{k.val}</div>
            <div className="ap-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="ap-loading">Loading analytics…</div>
      ) : (
        <>
          <div className="ap-row">

            {/* BAR CHART */}
            <div className="ap-card ap-card--wide">
              <p className="ap-card-title">TICKETS PER DAY</p>
              {daily.every(d => d.count === 0) ? (
                <div className="ap-empty">No ticket data for this period.</div>
              ) : (
                <div className="ap-bar-chart">
                  {daily.map(d => (
                    <div key={d.day} className="ap-bar-col">
                      <span className="ap-bar-val">{d.count}</span>
                      <div className="ap-bar-track">
                        <div className="ap-bar-fill"
                          style={{ height: `${(d.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="ap-bar-day">{d.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DONUT */}
            <div className="ap-card">
              <p className="ap-card-title">PRIORITY BREAKDOWN</p>
              {total === 0 ? (
                <div className="ap-empty" style={{ padding: '40px 0' }}>No data yet.</div>
              ) : (
                <div className="ap-donut-wrap">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    {donutSlices.map(s => (
                      <circle key={s.priority} cx="80" cy="80" r={R}
                        fill="none"
                        stroke={PRIORITY_COLORS[s.priority] || '#666'}
                        strokeWidth="20"
                        strokeDasharray={`${s.dash} ${s.gap}`}
                        strokeDashoffset={-s.offset}
                        transform="rotate(-90,80,80)" />
                    ))}
                    <text x="80" y="76" textAnchor="middle"
                      style={{ fill:'var(--text)', fontFamily:"'Bebas Neue'", fontSize:'22px' }}>
                      {total}
                    </text>
                    <text x="80" y="92" textAnchor="middle"
                      style={{ fill:'var(--muted)', fontSize:'10px' }}>TOTAL</text>
                  </svg>
                  <div className="ap-donut-legend">
                    {prioData.map(p => (
                      <div key={p.priority} className="ap-legend-item">
                        <span className="ap-legend-dot"
                          style={{ background: PRIORITY_COLORS[p.priority] || '#666' }} />
                        <span className="ap-legend-label">
                          {p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}
                        </span>
                        <span className="ap-legend-val"
                          style={{ color: PRIORITY_COLORS[p.priority] || '#666' }}>
                          {p.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QUEUE WAIT TABLE */}
          <div className="ap-card">
            <p className="ap-card-title">AVERAGE WAIT TIME BY QUEUE</p>
            {queueData.length === 0 ? (
              <div className="ap-empty">No queues configured yet.</div>
            ) : (
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Queue</th>
                    <th>Avg Wait</th>
                    <th>Tickets Served</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {queueData.map(q => {
                    const barW  = Math.min((q.avg_wait / 30) * 100, 100);
                    const color = q.avg_wait <= 10 ? '#22C55E'
                                : q.avg_wait <= 20 ? '#F59E0B'
                                : '#DC0F0F';
                    return (
                      <tr key={q.queue_id} className="ap-tr">
                        <td className="ap-td-name">{q.queue_name}</td>
                        <td>
                          <span className="ap-wait-val" style={{ color }}>
                            {q.avg_wait} min
                          </span>
                        </td>
                        <td className="ap-td-muted">{q.tickets}</td>
                        <td>
                          <div className="ap-perf-track">
                            <div className="ap-perf-fill"
                              style={{ width: `${barW}%`, background: color }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </DashLayout>
  );
}