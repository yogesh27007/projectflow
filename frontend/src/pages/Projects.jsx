import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, ArrowLeft, Clock, DollarSign, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const COLS = [
  { id: 'todo', label: 'To Do', color: '#6366f1' },
  { id: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
];
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function InfoCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '16px 18px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [project, setProject] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', start_date: '', due_date: '', estimated_hours: '' });

  const load = () => axios.get(`${API}/projects/${id}`, authHeaders).then(r => setProject(r.data));

  useEffect(() => {
    load();
    axios.get(`${API}/members`, authHeaders).then(r => setAllMembers(r.data));
  }, [id]);

  const addTask = async () => {
    if (!form.title.trim()) return;
    await axios.post(`${API}/tasks`, { ...form, project_id: id }, authHeaders);
    setForm({ title: '', description: '', priority: 'medium', assignee: '', start_date: '', due_date: '', estimated_hours: '' });
    setShowForm(false);
    load();
  };

  const moveTask = async (taskId, newStatus) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;
    await axios.put(`${API}/tasks/${taskId}`, { ...task, status: newStatus }, authHeaders);
    load();
  };

  const delTask = async (taskId) => {
    await axios.delete(`${API}/tasks/${taskId}`, authHeaders);
    load();
  };

  if (!project) return <div style={{ color: '#94a3b8', padding: 40 }}>Loading...</div>;

  const prog = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
  const budgetPct = project.budget_total > 0 ? Math.round((project.budget_spent / project.budget_total) * 100) : 0;
  const budgetLeft = project.budget_total - project.budget_spent;
  const budgetColor = budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : '#10b981';

  const today = new Date();
  const deadline = project.deadline ? new Date(project.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) : null;
  const startDate = project.start_date ? new Date(project.start_date) : null;
  const endDate = project.deadline ? new Date(project.deadline) : null;
  const durationDays = startDate && endDate
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    : 0;
  const delayedDays = daysLeft !== null && daysLeft < 0
    ? Math.abs(daysLeft)
    : 0;
  const daysColor = daysLeft === null ? '#94a3b8' : daysLeft < 7 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#10b981';

  const totalHours = (project.tasks || []).reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const doneHours = (project.tasks || []).filter(t => t.status === 'done').reduce((s, t) => s + (t.estimated_hours || 0), 0);

  const inputStyle = {
    padding: '9px 12px', fontSize: 12,
    background: '#ffffff', border: '1px solid #e2e8f0',
    borderRadius: 8, color: '#1e293b', outline: 'none'
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, textDecoration: 'none', marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, boxShadow: `0 0 10px ${project.color}` }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.5px' }}>{project.name}</h1>
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
              background: project.priority === 'high' ? '#fee2e2' : project.priority === 'medium' ? '#fef3c7' : '#dcfce7',
              color: project.priority === 'high' ? '#ef4444' : project.priority === 'medium' ? '#d97706' : '#16a34a',
              border: `1px solid ${project.priority === 'high' ? '#fecaca' : project.priority === 'medium' ? '#fcd34d' : '#bbf7d0'}`
            }}>{project.priority} priority</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>{project.description}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white', border: 'none', borderRadius: 10,
          padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
          boxShadow: '0 0 20px #6366f140'
        }}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Resource Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        <InfoCard icon={TrendingUp} label="Completion" value={`${prog}%`} sub={`${project.done_count}/${project.task_count} tasks`} color="#6366f1" />
        <InfoCard icon={DollarSign} label="Budget Left" value={`₹${budgetLeft.toLocaleString()}`} sub={`${budgetPct}% used of ₹${project.budget_total.toLocaleString()}`} color={budgetColor} />
        <InfoCard icon={Clock} label="Hours Done" value={`${doneHours}h`} sub={`${totalHours}h total estimated`} color="#f59e0b" />
        <InfoCard icon={Users} label="Team Size" value={project.members?.length || project.team_size} sub="members assigned" color="#ec4899" />
        <InfoCard
          icon={Calendar}
          label="Days Left"
          value={daysLeft !== null ? (daysLeft < 0 ? 'Overdue' : `${daysLeft}d`) : 'No deadline'}
          sub={project.final_deadline ? `Final: ${project.final_deadline}` : (project.deadline || 'Not set')}
          color={daysColor}
        />
        <InfoCard
          icon={Calendar}
          label="Project Duration"
          value={`${durationDays} Days`}
          sub={
            delayedDays > 0
              ? `Delayed by ${delayedDays} days`
              : 'On Schedule'
          }
          color="#8b5cf6"
        />
      </div>

      {/* Budget Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Budget Usage</span>
          <span style={{ fontSize: 12, color: budgetColor, fontWeight: 600 }}>₹{project.budget_spent.toLocaleString()} spent / ₹{project.budget_total.toLocaleString()} total</span>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4 }}>
          <div style={{
            height: '100%', width: `${Math.min(budgetPct, 100)}%`, borderRadius: 4,
            background: `linear-gradient(90deg, ${budgetColor}, ${budgetColor}80)`,
            boxShadow: `0 0 8px ${budgetColor}50`, transition: 'width 0.6s'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Started: {project.start_date || 'N/A'}</span>
          <span style={{ fontSize: 11, color: daysColor }}>Deadline: {project.deadline || 'N/A'}</span>
        </div>
      </div>

      {/* Gantt Timeline */}
      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          marginBottom: 25,
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ marginBottom: 15 }}>Project Timeline (Gantt)</h3>
        {!project.start_date || !project.deadline ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            Set a start date and deadline on this project to see the timeline.
          </p>
        ) : (project.tasks || []).map((task) => {
          const projectStart = new Date(project.start_date);
          const projectEnd = new Date(project.deadline);
          const total = projectEnd - projectStart;

          if (!total || total <= 0) return null;

          const rawStart = task.start_date ? new Date(task.start_date) : projectStart;
          const rawEnd = task.due_date ? new Date(task.due_date) : projectEnd;

          const clampedStart = new Date(Math.max(rawStart, projectStart));
          const clampedEnd = new Date(Math.min(Math.max(rawEnd, clampedStart), projectEnd));

          let left = ((clampedStart - projectStart) / total) * 100;
          let width = ((clampedEnd - clampedStart) / total) * 100;

          left = Math.min(Math.max(left, 0), 100);
          width = Math.max(Math.min(width, 100 - left), 3);

          return (
            <div key={task.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 5 }}>
                {task.title}
              </div>
              <div
                style={{
                  background: '#e5e7eb',
                  height: 12,
                  borderRadius: 20,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    height: '100%',
                    borderRadius: 20,
                    background:
                      task.status === 'done'
                        ? '#22c55e'
                        : task.status === 'in-progress'
                        ? '#f59e0b'
                        : '#6366f1',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Members */}
      {project.members?.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 12 }}>Assigned Team</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {project.members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 12px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                  {m.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showForm && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 14, color: '#1e293b', fontSize: 14 }}>New Task</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="Task title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={inputStyle} />
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={inputStyle}>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})} style={inputStyle}>
              <option value="">Assign to...</option>
              {allMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  start_date: e.target.value,
                })
              }
              style={inputStyle}
            />
            <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} style={inputStyle} />
            <input type="number" placeholder="Estimated hours" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: e.target.value})} style={inputStyle} />
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addTask} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add Task</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: '#64748b', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {COLS.map(col => {
          const colTasks = (project.tasks || []).filter(t => t.status === col.id);
          return (
            <div key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { const taskId = e.dataTransfer.getData('taskId'); moveTask(taskId, col.id); }}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, minHeight: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: '#f1f5f9', borderRadius: 20, padding: '1px 8px', fontSize: 11, color: '#64748b' }}>{colTasks.length}</span>
              </div>
              {colTasks.map(task => (
                <div key={task.id} draggable
                  onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                  style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: 12, marginBottom: 8, cursor: 'grab',
                    borderLeft: `2px solid ${PRIORITY_COLORS[task.priority] || '#94a3b8'}`
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>{task.title}</p>
                    <button onClick={() => delTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                  {task.description && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{task.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {task.assignee && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white' }}>
                          {task.assignee.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                      )}
                      {task.estimated_hours > 0 && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{task.estimated_hours}h</span>}
                    </div>
                    {task.due_date && <span style={{ fontSize: 10, color: '#94a3b8' }}>📅 {task.due_date}</span>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}