import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS = { active: '#3b82f6', completed: '#10b981', 'on-hold': '#f59e0b' };
const STATUS_LABELS = { active: 'In Progress', completed: 'Completed', 'on-hold': 'On Hold' };
const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981'];

const ACTIVITY_ICONS = {
  project_created: '✨',
  status_change: '🔄',
  task_done: '✅',
  member_added: '👤',
};

function CircularProgress({ percent, size = 110 }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="#000000" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', fontWeight: 800, color: '#1e293b'
      }}>
        {percent}%
      </div>
    </div>
  );
}

function StatPill({ label, value, color, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? '#000000' : '#f8fafc', padding: '10px 14px', borderRadius: '12px',
        border: `1px solid ${active ? '#000000' : '#e2e8f0'}`, cursor: 'pointer', transition: '0.15s',
        minWidth: '100px'
      }}
    >
      <span style={{ fontSize: '10px', color: active ? '#cbd5e1' : '#94a3b8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '18px', fontWeight: 800, color: active ? '#ffffff' : color, display: 'block', marginTop: '2px' }}>
        {value}
      </span>
    </div>
  );
}

function FocusTimer() {
  const DURATION = 25 * 60;
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', textAlign: 'center' }}>
      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Focus Mode
      </span>
      <div style={{ fontSize: '40px', fontWeight: 800, fontFamily: 'monospace', margin: '12px 0', color: '#1e293b' }}>
        {mins}:{secs}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={secondsLeft === 0}
          style={{
            width: '42px', height: '42px', borderRadius: '50%', border: 'none',
            background: '#000000', color: '#ffffff', cursor: secondsLeft === 0 ? 'default' : 'pointer',
            fontSize: '16px', opacity: secondsLeft === 0 ? 0.4 : 1
          }}
        >
          {running ? '❙❙' : '▶'}
        </button>
        <button
          onClick={() => { setRunning(false); setSecondsLeft(DURATION); }}
          style={{
            width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #e2e8f0',
            background: '#ffffff', color: '#64748b', cursor: 'pointer', fontSize: '16px'
          }}
        >
          ↺
        </button>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diffMs = new Date() - new Date(dateStr);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ projects: 0, tasks: 0, done: 0, members: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statFilter, setStatFilter] = useState('all');

  useEffect(() => {
  const headers = { Authorization: `Bearer ${token}` };
  Promise.all([
    fetch('http://localhost:5000/api/projects', { headers }).then((r) => r.json()),
    fetch('http://localhost:5000/api/stats', { headers }).then((r) => r.json()),
    fetch('http://localhost:5000/api/activity?limit=8', { headers }).then((r) => r.json()).catch(() => []),
  ])
      .then(([projectsData, statsData, activityData]) => {
        setProjects(projectsData);
        setStats(statsData);
        setActivity(Array.isArray(activityData) ? activityData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err);
        setLoading(false);
      });
  }, []);

  const today = new Date();

  const { activeCount, completedCount, totalBudget, totalSpent, overallProgress } = useMemo(() => {
    const activeCount = projects.filter((p) => p.status === 'active').length;
    const completedCount = projects.filter((p) => p.status === 'completed').length;
    const totalBudget = projects.reduce((s, p) => s + (p.budget_total || 0), 0);
    const totalSpent = projects.reduce((s, p) => s + (p.budget_spent || 0), 0);
    const totalTasks = projects.reduce((s, p) => s + (p.task_count || 0), 0);
    const totalDone = projects.reduce((s, p) => s + (p.done_count || 0), 0);
    const overallProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    return { activeCount, completedCount, totalBudget, totalSpent, overallProgress };
  }, [projects]);

  const filteredProjects = statFilter === 'all' ? projects : projects.filter((p) => p.status === statFilter);

  const budgetChartData = projects.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    Allocated: p.budget_total || 0,
    Spent: p.budget_spent || 0,
  }));

  const taskPieData = useMemo(() => {
    let done = 0, remaining = 0;
    projects.forEach((p) => {
      done += p.done_count || 0;
      remaining += (p.task_count || 0) - (p.done_count || 0);
    });
    return [{ name: 'Done', value: done }, { name: 'Remaining', value: remaining }].filter((d) => d.value > 0);
  }, [projects]);

  const ganttBounds = useMemo(() => {
    const dates = projects.flatMap((p) => [p.start_date, p.deadline]).filter(Boolean).map((d) => new Date(d));
    if (dates.length === 0) {
      const now = new Date();
      return { min: now, max: new Date(now.getTime() + 30 * 86400000) };
    }
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates, today.getTime()));
    return { min, max };
  }, [projects]);

  const totalSpan = Math.max(1, (ganttBounds.max - ganttBounds.min) / 86400000);
  const todayOffsetPct = Math.min(100, Math.max(0, ((today - ganttBounds.min) / 86400000 / totalSpan) * 100));

  if (loading) {
    return <div style={{ padding: 40, color: '#1e293b', fontFamily: 'system-ui' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#1e293b' }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Overview</h1>
      </div>

      {/* Main 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>

        {/* LEFT: main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quarterly progress + stat pills */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#000000' }} />
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Performance Analytics
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 16px 0' }}>Quarterly Progress</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatPill label="All Projects" value={projects.length} color="#1e293b" active={statFilter === 'all'} onClick={() => setStatFilter('all')} />
                <StatPill label="In Progress" value={activeCount} color="#3b82f6" active={statFilter === 'active'} onClick={() => setStatFilter('active')} />
                <StatPill label="Completed" value={completedCount} color="#10b981" active={statFilter === 'completed'} onClick={() => setStatFilter('completed')} />
                <StatPill label="Members" value={stats.members} color="#ec4899" active={false} onClick={() => {}} />
              </div>
              <CircularProgress percent={overallProgress} />
            </div>
          </div>

          {/* Project Portfolio */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                {statFilter === 'all' ? 'Project Portfolio' : STATUS_LABELS[statFilter] || statFilter} ({filteredProjects.length})
              </h2>
              <span onClick={() => navigate('/projects')} style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                View All →
              </span>
            </div>
            {filteredProjects.length === 0 ? (
              <div style={{ background: '#ffffff', padding: '32px', textAlign: 'center', borderRadius: '18px', color: '#64748b', fontWeight: 500, border: '1px solid #e2e8f0' }}>
                No projects in this category.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {filteredProjects.map((p) => {
                  const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
                  const color = STATUS_COLORS[p.status] || '#94a3b8';
                  const members = p.members || [];
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      style={{
                        background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0',
                        cursor: 'pointer', position: 'relative', overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{p.name}</h3>
                        <span style={{
                          fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color,
                          background: `${color}15`, padding: '3px 7px', borderRadius: '6px'
                        }}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px 0' }}>{progress}% complete</p>
                      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: color }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex' }}>
                          {members.slice(0, 3).map((m, i) => (
                            <div key={m.id} title={m.name} style={{
                              width: '20px', height: '20px', borderRadius: '50%', background: m.avatar_color || '#94a3b8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700,
                              color: '#fff', border: '1px solid #fff', marginLeft: i === 0 ? 0 : '-6px'
                            }}>
                              {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                          ))}
                        </div>
                        {p.deadline && <span style={{ fontSize: '10px', color: '#94a3b8' }}>📅 {p.deadline}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gantt timeline */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0' }}>Project Timeline</h2>
            {projects.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>No projects to show on the timeline yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {projects.map((p) => {
                  const start = p.start_date ? new Date(p.start_date) : ganttBounds.min;
                  const end = p.deadline ? new Date(p.deadline) : start;
                  const startPct = Math.min(100, Math.max(0, ((start - ganttBounds.min) / 86400000 / totalSpan) * 100));
                  const widthPct = Math.max(2, ((end - start) / 86400000 / totalSpan) * 100);
                  const color = STATUS_COLORS[p.status] || '#94a3b8';
                  const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
                  return (
                    <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{STATUS_LABELS[p.status] || p.status} · {progress}%</span>
                      </div>
                      <div style={{ position: 'relative', height: '14px', background: '#f1f5f9', borderRadius: '999px' }}>
                        <div style={{ position: 'absolute', left: `${startPct}%`, width: `${widthPct}%`, height: '100%', borderRadius: '999px', background: color, opacity: 0.85 }} />
                        <div style={{ position: 'absolute', left: `${todayOffsetPct}%`, top: '-4px', bottom: '-4px', width: '2px', background: '#1e293b' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <div style={{ width: '2px', height: '12px', background: '#1e293b' }} />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Today</span>
                </div>
              </div>
            )}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Budget: Allocated vs Spent</h2>
              {projects.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No budget data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={budgetChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Allocated" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Spent" fill="#000000" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Task Completion</h2>
              {taskPieData.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No tasks logged yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={taskPieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {taskPieData.map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: sidebar column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FocusTimer />

          {/* Recent Activity */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px 0' }}>Recent Activity</h2>
            {activity.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>No activity yet. Create or update a project to see it here.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activity.map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0
                    }}>
                      {ACTIVITY_ICONS[a.type] || '•'}
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', margin: 0, color: '#334155' }}>
                        <strong>{a.actor_name || 'Someone'}</strong> {a.message}
                      </p>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{timeAgo(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}