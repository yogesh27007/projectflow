import React, { useState, useEffect } from 'react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('pf_token')}` });
const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0284c7', '#8b5cf6'];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [logSummary, setLogSummary] = useState({});
  const [logsByMember, setLogsByMember] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', role: '', email: '' });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [showLogModal, setShowLogModal] = useState(false);
  const [logMember, setLogMember] = useState(null);
  const [logForm, setLogForm] = useState({ project_id: '', date: todayStr(), tasks_completed: '', hours_spent: '', budget_used: '', breaks_taken: '', notes: '' });
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logError, setLogError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', email: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const loadAll = () => {
  const headers = authHeaders();
  Promise.all([
    fetch('http://localhost:5000/api/members', { headers }).then((r) => r.ok ? r.json() : []),
    fetch('http://localhost:5000/api/projects', { headers }).then((r) => r.ok ? r.json() : []),
    fetch('http://localhost:5000/api/dailylogs/summary', { headers }).then((r) => r.ok ? r.json() : []),
    fetch('http://localhost:5000/api/dailylogs', { headers }).then((r) => r.ok ? r.json() : []),
  ])
    .then(([membersData, projectsData, summaryData, logsData]) => {
      setMembers(Array.isArray(membersData) ? membersData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      const summaryMap = {};
      (Array.isArray(summaryData) ? summaryData : []).forEach((s) => { summaryMap[s.member_id] = s; });
      setLogSummary(summaryMap);

      const grouped = {};
      (Array.isArray(logsData) ? logsData : []).forEach((log) => {
        if (!grouped[log.member_id]) grouped[log.member_id] = [];
        grouped[log.member_id].push(log);
      });
      setLogsByMember(grouped);

      setLoading(false);
    })
    .catch((err) => {
      console.error('Fetch error:', err);
      setMembers([]);
      setLoading(false);
    });
};

  useEffect(() => {
    loadAll();
  }, []);

  // Invite member
  const openInviteModal = () => {
    setInviteForm({ name: '', role: '', email: '' });
    setInviteError('');
    setShowInviteModal(true);
  };

  const handleInvite = async () => {
    if (!inviteForm.name.trim()) {
      setInviteError('Name is required.');
      return;
    }
    setInviteSubmitting(true);
    setInviteError('');
    const email = inviteForm.email.trim() || `${inviteForm.name.toLowerCase().replace(/\s+/g, '.')}@project.com`;
    const avatar_color = AVATAR_COLORS[members.length % AVATAR_COLORS.length];

    try {
      const res = await fetch('http://localhost:5000/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteForm.name.trim(),
          role: inviteForm.role.trim() || 'Associate Contributor',
          email,
          avatar_color,
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setShowInviteModal(false);
      loadAll();
    } catch (err) {
      console.error('Invite error:', err);
      setInviteError('Could not add member. Check that the backend is running.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveMember = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the team?`)) return;
    try {
     const res = await fetch(`http://localhost:5000/api/members/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Request failed');
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Remove error:', err);
      alert('Could not remove member. Check that the backend is running.');
    }
  };

  // Daily log
  const openLogModal = (member) => {
    setLogMember(member);
    setLogForm({ project_id: '', date: todayStr(), tasks_completed: '', hours_spent: '', budget_used: '', breaks_taken: '', notes: '' });
    setLogError('');
    setShowLogModal(true);
  };

  const handleSaveLog = async () => {
    setLogSubmitting(true);
    setLogError('');
    try {
    const res = await fetch('http://localhost:5000/api/dailylogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: logMember.id,
          project_id: logForm.project_id || null,
          date: logForm.date,
          tasks_completed: parseInt(logForm.tasks_completed) || 0,
          hours_spent: parseFloat(logForm.hours_spent) || 0,
          budget_used: parseFloat(logForm.budget_used) || 0,
          breaks_taken: parseInt(logForm.breaks_taken) || 0,
          notes: logForm.notes.trim(),
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setShowLogModal(false);
      loadAll();
    } catch (err) {
      console.error('Log save error:', err);
      setLogError('Could not save log. Check that the backend is running.');
    } finally {
      setLogSubmitting(false);
    }
  };

  // Edit member
  const openEditModal = (member) => {
    setEditMember(member);
    setEditForm({ name: member.name, role: member.role, email: member.email });
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setEditError('Name is required.');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      const res = await fetch(`http://localhost:5000/api/members/${editMember.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', ...authHeaders() },
  body: JSON.stringify({ name: editForm.name.trim(), role: editForm.role.trim(), email: editForm.email.trim() }),
});
      if (!res.ok) throw new Error('Request failed');
      setShowEditModal(false);
      loadAll();
    } catch (err) {
      console.error('Edit error:', err);
      setEditError('Could not save changes. Check that the backend is running.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: '#1e293b', fontFamily: 'system-ui' }}>Loading team roster...</div>;
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0',
    fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Workspace Roster</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Monitor live team availability and daily contribution metrics.</p>
        </div>
        <button
          onClick={openInviteModal}
          style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Invite Member
        </button>
      </div>

      {members.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No team members yet. Click "Invite Member" to add one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {members.map((member) => {
            const initials = getInitials(member.name);
            const color = member.avatar_color || '#6366f1';
            const summary = logSummary[member.id] || { total_tasks: 0, total_hours: 0, total_budget: 0, total_breaks: 0 };
            const history = (logsByMember[member.id] || []).slice(0, 8);
            const isExpanded = expandedId === member.id;

            return (
              <div key={member.id} style={{
                background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px',
                display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 'bold', color: '#ffffff', flexShrink: 0
                  }}>{initials}</div>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{member.name}</h3>
                    <p
                      onClick={() => openEditModal(member)}
                      style={{ margin: 0, color: '#0284c7', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline dashed' }}
                      title="Click to edit"
                    >
                      {member.role}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, wordBreak: 'break-all' }}>{member.email}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{summary.total_tasks}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Tasks Done</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{summary.total_hours}h</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Hours Spent</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>₹{summary.total_budget.toLocaleString()}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Budget Used</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{summary.total_breaks}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Breaks Taken</span>
                  </div>
                </div>

                {history.length > 0 && (
                  <div>
                    <span
                      onClick={() => setExpandedId(isExpanded ? null : member.id)}
                      style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {isExpanded ? 'Hide history' : `View history (${history.length})`}
                    </span>
                    {isExpanded && (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                        {history.map((log) => {
                          const proj = projects.find((p) => p.id === log.project_id);
                          return (
                            <div key={log.id} style={{ fontSize: '11px', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#334155' }}>
                                <span>{log.date}</span>
                                {proj && <span style={{ color: '#94a3b8' }}>{proj.name}</span>}
                              </div>
                              <span style={{ color: '#64748b' }}>
                                {log.tasks_completed} tasks · {log.hours_spent}h · ₹{log.budget_used} · {log.breaks_taken} breaks
                              </span>
                              {log.notes && <div style={{ color: '#94a3b8', marginTop: '2px' }}>{log.notes}</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openLogModal(member)}
                    style={{ flex: 1, height: '36px', borderRadius: '10px', border: 'none', background: '#000000', color: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Log Today
                  </button>
                  <button
                    onClick={() => alert(`Opening active messaging terminal session with ${member.name}...`)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', cursor: 'pointer' }}>
                    Chat
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #ef4444', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>
                    X
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          onClick={() => !inviteSubmitting && setShowInviteModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', width: '380px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>Invite Team Member</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Add a new collaborator to the roster.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: inviteError ? '8px' : '20px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input autoFocus value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="e.g. Priya Mehta" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} placeholder="e.g. Designer, Backend Dev" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="auto-generated if left blank" style={inputStyle} />
              </div>
            </div>

            {inviteError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 12px 0' }}>{inviteError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleInvite} disabled={inviteSubmitting} style={{ flex: 1, background: '#000000', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: inviteSubmitting ? 'default' : 'pointer', opacity: inviteSubmitting ? 0.6 : 1 }}>
                {inviteSubmitting ? 'Adding...' : 'Add Member'}
              </button>
              <button onClick={() => setShowInviteModal(false)} disabled={inviteSubmitting} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Log Modal */}
      {showLogModal && logMember && (
        <div
          onClick={() => !logSubmitting && setShowLogModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', width: '420px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>Log Daily Update</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>For {logMember.name}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Project (optional)</label>
                  <select value={logForm.project_id} onChange={(e) => setLogForm({ ...logForm, project_id: e.target.value })} style={inputStyle}>
                    <option value="">No specific project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Tasks Completed</label>
                  <input type="number" min="0" value={logForm.tasks_completed} onChange={(e) => setLogForm({ ...logForm, tasks_completed: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hours Spent</label>
                  <input type="number" min="0" step="0.5" value={logForm.hours_spent} onChange={(e) => setLogForm({ ...logForm, hours_spent: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Budget Used</label>
                  <input type="number" min="0" value={logForm.budget_used} onChange={(e) => setLogForm({ ...logForm, budget_used: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Breaks Taken</label>
                  <input type="number" min="0" value={logForm.breaks_taken} onChange={(e) => setLogForm({ ...logForm, breaks_taken: e.target.value })} placeholder="0" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea rows={2} value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} placeholder="Anything worth noting about today" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>

            {logError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '14px 0 0 0' }}>{logError}</p>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={handleSaveLog} disabled={logSubmitting} style={{ flex: 1, background: '#000000', color: '#ffffff', border: 'none', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: logSubmitting ? 'default' : 'pointer', opacity: logSubmitting ? 0.6 : 1 }}>
                {logSubmitting ? 'Saving...' : 'Save Log'}
              </button>
              <button onClick={() => setShowLogModal(false)} disabled={logSubmitting} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 18px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editMember && (
        <div
          onClick={() => !editSubmitting && setShowEditModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', width: '380px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>Edit Member</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Update details for {editMember.name}.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: editError ? '8px' : '20px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input autoFocus value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {editError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 12px 0' }}>{editError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveEdit} disabled={editSubmitting} style={{ flex: 1, background: '#000000', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: editSubmitting ? 'default' : 'pointer', opacity: editSubmitting ? 0.6 : 1 }}>
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditModal(false)} disabled={editSubmitting} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}