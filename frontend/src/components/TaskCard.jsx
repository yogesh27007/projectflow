const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function TaskCard({ task }) {
  const initials = task.assignee ? task.assignee.split(' ').map(n => n[0]).join('').slice(0,2) : '?';
  return (
    <div draggable onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
      style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '14px', marginBottom: 8, cursor: 'grab',
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#94a3b8'}`
      }}>
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#1e293b' }}>{task.title}</p>
      {task.description && <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{task.description}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: 'white'
        }}>{initials}</div>
        {task.due_date && <span style={{ fontSize: 11, color: '#94a3b8' }}>📅 {task.due_date}</span>}
      </div>
    </div>
  );
}