const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { logActivity } = require('./activity');

// Small helper: checks that a string is a real date in YYYY-MM-DD format.
// We use this instead of just `new Date(x)` because new Date() is too forgiving -
// it will happily "parse" garbage like "banana" into Invalid Date without throwing.
function isValidDateString(value) {
  if (!value) return true; // empty/null dates are allowed (optional fields)
  const parsed = new Date(value);
  return !isNaN(parsed.getTime());
}

router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, COUNT(t.id) as task_count,
    SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done_count
    FROM projects p LEFT JOIN tasks t ON p.id = t.project_id
    GROUP BY p.id ORDER BY p.created_at DESC
  `).all();

  const withMembers = projects.map(p => {
    const members = db.prepare(`
      SELECT m.* FROM members m
      JOIN project_members pm ON pm.member_id = m.id
      WHERE pm.project_id = ?
    `).all(p.id);
    return {
      ...p,
      task_count: p.task_count || 0,
      done_count: p.done_count || 0,
      members
    };
  });

  res.json(withMembers);
});

router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id=? ORDER BY created_at DESC').all(req.params.id);

  const members = db.prepare(`
    SELECT m.* FROM members m
    JOIN project_members pm ON pm.member_id = m.id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  const task_count = tasks.length;
  const done_count = tasks.filter(t => t.status === 'done').length;

  res.json({ ...project, tasks, members, task_count, done_count });
});

router.post('/', (req, res) => {
  const {
    name, description, color, priority, budget_total,
    start_date, deadline, final_deadline, team_size, member_ids
  } = req.body;

  // ---- Validation block ----
  // We collect ALL problems instead of stopping at the first one,
  // so the user sees everything wrong in one go instead of fixing
  // one field, resubmitting, and hitting the next error.
  const errors = [];

  if (!name || !name.trim()) errors.push('Project name is required.');
  if (name && name.trim().length > 120) errors.push('Project name must be under 120 characters.');

  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    errors.push('Priority must be high, medium, or low.');
  }

  if (budget_total !== undefined && budget_total !== '' && (isNaN(budget_total) || Number(budget_total) < 0)) {
    errors.push('Budget must be a positive number.');
  }

  if (!isValidDateString(start_date)) errors.push('Start date is not a valid date.');
  if (!isValidDateString(deadline)) errors.push('Deadline is not a valid date.');
  if (!isValidDateString(final_deadline)) errors.push('Final deadline is not a valid date.');

  if (start_date && deadline && isValidDateString(start_date) && isValidDateString(deadline)) {
    if (new Date(deadline) < new Date(start_date)) {
      errors.push('Deadline cannot be before the start date.');
    }
  }

  if (member_ids && !Array.isArray(member_ids)) {
    errors.push('member_ids must be a list.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }
  // ---- End validation ----

  const id = uuidv4();
  db.prepare(`
    INSERT INTO projects
      (id, name, description, status, color, priority, budget_total, budget_spent, start_date, deadline, final_deadline, team_size)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, name.trim(), (description || '').trim(), 'active', color || '#6366f1',
    priority || 'medium', budget_total ? Number(budget_total) : 0, 0,
    start_date || null, deadline || null, final_deadline || null,
    team_size || (member_ids?.length || 1)
  );

  if (Array.isArray(member_ids)) {
    const insMember = db.prepare('INSERT OR IGNORE INTO project_members VALUES (?,?)');
    member_ids.forEach(mid => insMember.run(id, mid));
  }

  logActivity({
    type: 'project_created',
    actor_name: 'You',
    project_id: id,
    message: `created project "${name.trim()}"`
  });

  res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(id));
});

router.put('/:id', (req, res) => {
  const {
    name, description, status, color, priority,
    budget_total, budget_spent, start_date, deadline, final_deadline, team_size
  } = req.body;

  const existing = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  // ---- Validation block ----
  const errors = [];

  if (name !== undefined && !name.trim()) errors.push('Project name cannot be empty.');
  if (status && !['active', 'completed', 'on-hold'].includes(status)) {
    errors.push('Status must be active, completed, or on-hold.');
  }
  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    errors.push('Priority must be high, medium, or low.');
  }
  if (budget_total !== undefined && (isNaN(budget_total) || Number(budget_total) < 0)) {
    errors.push('Budget total must be a positive number.');
  }
  if (budget_spent !== undefined && (isNaN(budget_spent) || Number(budget_spent) < 0)) {
    errors.push('Budget spent must be a positive number.');
  }
  if (!isValidDateString(start_date)) errors.push('Start date is not a valid date.');
  if (!isValidDateString(deadline)) errors.push('Deadline is not a valid date.');
  if (!isValidDateString(final_deadline)) errors.push('Final deadline is not a valid date.');

  const effectiveStart = start_date ?? existing.start_date;
  const effectiveDeadline = deadline ?? existing.deadline;
  if (effectiveStart && effectiveDeadline && isValidDateString(effectiveStart) && isValidDateString(effectiveDeadline)) {
    if (new Date(effectiveDeadline) < new Date(effectiveStart)) {
      errors.push('Deadline cannot be before the start date.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }
  // ---- End validation ----

  db.prepare(`
    UPDATE projects SET
      name=?, description=?, status=?, color=?, priority=?,
      budget_total=?, budget_spent=?, start_date=?, deadline=?, final_deadline=?, team_size=?
    WHERE id=?
  `).run(
    name !== undefined ? name.trim() : existing.name,
    description ?? existing.description,
    status ?? existing.status,
    color ?? existing.color,
    priority ?? existing.priority,
    budget_total !== undefined ? Number(budget_total) : existing.budget_total,
    budget_spent !== undefined ? Number(budget_spent) : existing.budget_spent,
    start_date ?? existing.start_date,
    deadline ?? existing.deadline,
    final_deadline ?? existing.final_deadline,
    team_size ?? existing.team_size,
    req.params.id
  );

  if (status && status !== existing.status) {
    logActivity({
      type: 'status_change',
      actor_name: 'You',
      project_id: req.params.id,
      message: `marked "${existing.name}" as ${status}`
    });
  }

  res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;