import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('pf_token')}` });
const STATUS_STYLES = {
  active:    { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd', label: 'In Progress' },
  completed: { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', label: 'Completed' },
  'on-hold': { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', label: 'On Hold' },
};

const TABS = [
  { key: 'all', label: 'All Projects' },
  { key: 'active', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const COLOR_SWATCHES = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0284c7', '#8b5cf6', '#ef4444', '#14b8a6'];

const EMPTY_FORM = {
  name: '', description: '', priority: 'medium', color: COLOR_SWATCHES[0],
  budget_total: '', start_date: '', deadline: '', final_deadline: '', resource_allocation: '', member_ids: []
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

const loadProjects = () => {
  fetch('http://localhost:5000/api/projects', { headers: authHeaders() })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => { setProjects(Array.isArray(data) ? data : []); setLoading(false); })
    .catch((err) => { console.error('Fetch error:', err); setProjects([]); setLoading(false); });
};

  useEffect(() => {
  loadProjects();
  fetch('http://localhost:5000/api/members', { headers: authHeaders() })
    .then((res) => res.json())
    .then(setAllMembers)
    .catch((err) => console.error('Members fetch error:', err));
}, []);

  // Close the open card menu if you click anywhere else on the page
  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const toggleMember = (memberId) => {
    setForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(memberId)
        ? prev.member_ids.filter((id) => id !== memberId)
        : [...prev.member_ids, memberId]
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('Project name is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
   const res = await fetch('http://localhost:5000/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...authHeaders() },
  body: JSON.stringify({
    name: form.name.trim(),
    description: form.description.trim(),
    resource_allocation: form.resource_allocation,
    color: form.color,
    priority: form.priority,
    budget_total: form.budget_total ? parseFloat(form.budget_total) : 0,
    start_date: form.start_date || null,
    deadline: form.deadline || null,
    final_deadline: form.final_deadline || null,
    team_size: form.member_ids.length || 1,
    member_ids: form.member_ids,
  }),
});
      if (!res.ok) throw new Error('Request failed');
      setShowModal(false);
      loadProjects();
    } catch (err) {
      console.error('Create error:', err);
      setError('Could not create project. Check that the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!window.confirm(`Delete "${project.name}"? This will also remove its tasks. This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Request failed');
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete project. Check that the backend is running.');
    }
  };

  const handleStatusChange = async (e, project, newStatus) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
 const res = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', ...authHeaders() },
  body: JSON.stringify({ status: newStatus }),
});
      if (!res.ok) throw new Error('Request failed');
      loadProjects();
    } catch (err) {
      console.error('Status update error:', err);
      alert('Could not update status. Check that the backend is running.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, color: '#1e293b', fontFamily: 'system-ui' }}>
        Loading System Database...
      </div>
    );
  }

  const filteredProjects = activeTab === 'all'
    ? projects
    : projects.filter((p) => p.status === activeTab);

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0',
    fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Project Catalog</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Manage, organize, and monitor active streams.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={openModal}
            style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + Create Project
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', paddingBottom: '4px', overflowX: 'auto' }}>
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? projects.length : projects.filter((p) => p.status === tab.key).length;
          const isActive = activeTab === tab.key;
          return (
            <span
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontSize: '14px', fontWeight: isActive ? 700 : 500, color: isActive ? '#000000' : '#64748b',
                paddingBottom: '12px', borderBottom: isActive ? '2px solid #000000' : 'none',
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {tab.label} ({count})
            </span>
          );
        })}
      </div>

      {filteredProjects.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No projects in this category yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredProjects.map((project) => {
            const style = STATUS_STYLES[project.status] || STATUS_STYLES.active;
            const progress = project.task_count > 0
              ? Math.round((project.done_count / project.task_count) * 100)
              : 0;

            const today = new Date();
            const deadline = project.deadline ? new Date(project.deadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) : null;

            const members = project.members || [];
            const visibleMembers = members.slice(0, 2);
            const extraCount = members.length - visibleMembers.length;
            const menuOpen = openMenuId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  background: style.bg, borderRadius: '24px', padding: '24px', border: `1px solid ${style.border}`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px',
                  cursor: 'pointer', transition: 'transform 0.15s ease', position: 'relative'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', background: '#ffffff', padding: '4px 10px', borderRadius: '8px', color: style.text, fontWeight: 600 }}>
                      {style.label}
                    </span>
                    <span
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : project.id); }}
                      style={{ color: '#64748b', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px' }}
                    >
                      ...
                    </span>
                    {menuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute', top: '40px', right: '20px', background: '#ffffff',
                          borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          zIndex: 10, minWidth: '180px', overflow: 'hidden'
                        }}
                      >
                        {project.status !== 'active' && (
                          <div onClick={(e) => handleStatusChange(e, project, 'active')} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#0284c7', cursor: 'pointer' }}>
                            Mark as In Progress
                          </div>
                        )}
                        {project.status !== 'completed' && (
                          <div onClick={(e) => handleStatusChange(e, project, 'completed')} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#16a34a', cursor: 'pointer' }}>
                            Mark as Completed
                          </div>
                        )}
                        {project.status !== 'on-hold' && (
                          <div onClick={(e) => handleStatusChange(e, project, 'on-hold')} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#d97706', cursor: 'pointer' }}>
                            Mark as On Hold
                          </div>
                        )}
                        <div onClick={(e) => handleDelete(e, project)} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#ef4444', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}>
                          Delete Project
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{project.name}</h3>
                  <p style={{
                    margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', fontWeight: 500,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {project.description || 'No description'}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '6px 12px', borderRadius: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: style.text }}>{progress}%</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex' }}>
                      {visibleMembers.length > 0 ? visibleMembers.map((m, i) => (
                        <div
                          key={m.id}
                          title={m.name}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%', background: m.avatar_color || '#ffffff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0',
                            fontSize: '10px', fontWeight: 'bold', color: '#ffffff', marginLeft: i === 0 ? 0 : '-6px'
                          }}
                        >
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                      )) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No members</span>
                      )}
                      {extraCount > 0 && (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%', background: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0',
                          fontSize: '9px', fontWeight: 'bold', color: '#64748b', marginLeft: '-6px'
                        }}>
                          +{extraCount}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', background: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontWeight: 600, color: '#64748b' }}>
                      {daysLeft === null ? 'No deadline' : daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div
          onClick={() => !submitting && setShowModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: '20px', padding: '28px',
              width: '480px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>Create New Project</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Set up a new project stream.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Customer Portal Revamp"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief summary of the project"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Resource Allocation</label>
                <textarea
                  value={form.resource_allocation}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      resource_allocation: e.target.value,
                    })
                  }
                  placeholder="Example: 2 Developers, 1 UI Designer, 1 Tester"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLOR_SWATCHES.map((c) => (
                    <div
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer',
                        border: form.color === c ? '3px solid #1e293b' : '2px solid transparent',
                        boxSizing: 'border-box'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Budget (₹)</label>
                  <input
                    type="number"
                    value={form.budget_total}
                    onChange={(e) => setForm({ ...form, budget_total: e.target.value })}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Planned Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Final Deadline (optional)</label>
                <input
                  type="date"
                  value={form.final_deadline}
                  onChange={(e) => setForm({ ...form, final_deadline: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Assign Team Members</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {allMembers.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>No members yet — add some in Team first.</span>
                  )}
                  {allMembers.map((m) => {
                    const selected = form.member_ids.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMember(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          background: selected ? '#000000' : '#f8fafc',
                          color: selected ? '#ffffff' : '#334155',
                          border: `1px solid ${selected ? '#000000' : '#e2e8f0'}`
                        }}
                      >
                        {m.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '14px 0 0 0' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={handleCreate}
                disabled={submitting}
                style={{
                  flex: 1, background: '#000000', color: '#ffffff', border: 'none',
                  padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                  cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1
                }}>
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                  padding: '11px 18px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}