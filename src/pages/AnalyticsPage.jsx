import { useState } from 'react';
import DashLayout from '../components/DashboardLayout';
import '../styles/analytics.css';

// =============================================================
// ANALYTICS PAGE
// Features:
//   - KPI cards: total tickets, avg/day, avg wait, peak day
//   - Bar chart: tickets per day (pure CSS)
//   - Donut chart: priority breakdown (SVG)
//   - Table: avg wait time per queue
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================

const DAILY_DATA = [
  { day: 'Mon', count: 42 },
  { day: 'Tue', count: 58 },
  { day: 'Wed', count: 35 },
  { day: 'Thu', count: 71 },
  { day: 'Fri', count: 63 },
  { day: 'Sat', count: 28 },
  { day: 'Sun', count: 14 },
];

const PRIORITY_DATA = [
  { label: 'Normal', count: 68, color: '#666',    pct: 55 },
  { label: 'High',   count: 37, color: '#F59E0B', pct: 30 },
  { label: 'Urgent', count: 18, color: '#DC0F0F', pct: 15 },
];

const QUEUE_WAIT_DATA = [
  { name: 'General Service',   avgWait: 12, tickets: 89 },
  { name: 'VIP Service',       avgWait: 5,  tickets: 23 },
  { name: 'Technical Support', avgWait: 24, tickets: 41 },
];

const PERIODS = ['This Week', 'Last Week', 'This Month'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('This Week');

  const maxCount     = Math.max(...DAILY_DATA.map(d => d.count));
  const totalTickets = DAILY_DATA.reduce((a, d) => a + d.count, 0);
  const avgPerDay    = Math.round(totalTickets / DAILY_DATA.length);
  const avgWait      = Math.round(QUEUE_WAIT_DATA.reduce((a,q) => a + q.avgWait, 0) / QUEUE_WAIT_DATA.length);
  const peakDay      = DAILY_DATA.reduce((a, b) => a.count > b.count ? a : b);

  // SVG Donut
  const R = 60; const circumference = 2 * Math.PI * R;
  let offset = 0;
  const donutSlices = PRIORITY_DATA.map(p => {
    const dash  = (p.pct / 100) * circumference;
    const slice = { ...p, dash, gap: circumference - dash, offset };
    offset += dash;
    return slice;
  });

  return (
    <DashLayout title="Analytics" subtitle="INSIGHTS">

      <div className="ap-period-row">
        {PERIODS.map(p => (
          <button key={p} className={`ap-period-btn ${period===p?'active':''}`}
            onClick={() => setPeriod(p)}>{p}</button>
        ))}
      </div>

      <div className="ap-kpis">
        {[
          { label: 'Total Tickets',  val: totalTickets,    icon: '🎟', col: '#DC0F0F' },
          { label: 'Avg / Day',      val: avgPerDay,        icon: '📅', col: '#3B82F6' },
          { label: 'Avg Wait (min)', val: avgWait + 'm',   icon: '⏱', col: '#F59E0B' },
          { label: 'Peak Day',       val: peakDay.day,      icon: '📈', col: '#22C55E' },
        ].map(k => (
          <div key={k.label} className="ap-kpi">
            <div className="ap-kpi-icon" style={{ color: k.col, background: k.col + '18' }}>{k.icon}</div>
            <div className="ap-kpi-val"  style={{ color: k.col }}>{k.val}</div>
            <div className="ap-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="ap-row">
        {/* Bar chart */}
        <div className="ap-card ap-card--wide">
          <p className="ap-card-title">TICKETS PER DAY</p>
          <div className="ap-bar-chart">
            {DAILY_DATA.map(d => (
              <div key={d.day} className="ap-bar-col">
                <span className="ap-bar-val">{d.count}</span>
                <div className="ap-bar-track">
                  <div className="ap-bar-fill" style={{ height: `${(d.count/maxCount)*100}%` }} />
                </div>
                <span className="ap-bar-day">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="ap-card">
          <p className="ap-card-title">PRIORITY BREAKDOWN</p>
          <div className="ap-donut-wrap">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {donutSlices.map(s => (
                <circle key={s.label} cx="80" cy="80" r={R}
                  fill="none" stroke={s.color} strokeWidth="20"
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-s.offset}
                  transform="rotate(-90,80,80)" />
              ))}
              <text x="80" y="76" textAnchor="middle"
                style={{ fill:'var(--text)', fontFamily:"'Bebas Neue'", fontSize:'22px' }}>
                {totalTickets}
              </text>
              <text x="80" y="92" textAnchor="middle"
                style={{ fill:'var(--muted)', fontSize:'10px' }}>TOTAL</text>
            </svg>
            <div className="ap-donut-legend">
              {PRIORITY_DATA.map(p => (
                <div key={p.label} className="ap-legend-item">
                  <span className="ap-legend-dot" style={{ background: p.color }} />
                  <span className="ap-legend-label">{p.label}</span>
                  <span className="ap-legend-val"  style={{ color: p.color }}>{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wait time table */}
      <div className="ap-card">
        <p className="ap-card-title">AVERAGE WAIT TIME BY QUEUE</p>
        <table className="ap-table">
          <thead><tr><th>Queue</th><th>Avg Wait</th><th>Tickets Served</th><th>Performance</th></tr></thead>
          <tbody>
            {QUEUE_WAIT_DATA.map(q => {
              const barW  = Math.min((q.avgWait / 30) * 100, 100);
              const color = q.avgWait <= 10 ? '#22C55E' : q.avgWait <= 20 ? '#F59E0B' : '#DC0F0F';
              return (
                <tr key={q.name} className="ap-tr">
                  <td className="ap-td-name">{q.name}</td>
                  <td><span className="ap-wait-val" style={{ color }}>{q.avgWait} min</span></td>
                  <td className="ap-td-muted">{q.tickets}</td>
                  <td>
                    <div className="ap-perf-track">
                      <div className="ap-perf-fill" style={{ width:`${barW}%`, background: color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashLayout>
  );
}