const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { logActivity } = require('./activity');

// Get all logs, optionally filtered by member_id or project_id
router.get('/', (req, res) => {
  const { member_id, project_id } = req.query;
  let query = 'SELECT * FROM daily_logs';
  const conditions = [];
  const params = [];

  if (member_id) { conditions.push('member_id = ?'); params.push(member_id); }
  if (project_id) { conditions.push('project_id = ?'); params.push(project_id); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY date DESC, created_at DESC';

  res.json(db.prepare(query).all(...params));
});

// Get aggregated totals per member (for Team cards)
router.get('/summary', (req, res) => {
  const rows = db.prepare(`
    SELECT
      member_id,
      SUM(tasks_completed) as total_tasks,
      SUM(hours_spent) as total_hours,
      SUM(budget_used) as total_budget,
      SUM(breaks_taken) as total_breaks,
      COUNT(*) as days_logged
    FROM daily_logs
    GROUP BY member_id
  `).all();

  // Normalize nulls to 0
  const normalized = rows.map(r => ({
    member_id: r.member_id,
    total_tasks: r.total_tasks || 0,
    total_hours: r.total_hours || 0,
    total_budget: r.total_budget || 0,
    total_breaks: r.total_breaks || 0,
    days_logged: r.days_logged || 0,
  }));

  res.json(normalized);
});

router.post('/', (req, res) => {
  const { member_id, project_id, date, tasks_completed, hours_spent, budget_used, breaks_taken, notes } = req.body;

  if (!member_id || !date) {
    return res.status(400).json({ error: 'member_id and date are required' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO daily_logs (id, member_id, project_id, date, tasks_completed, hours_spent, budget_used, breaks_taken, notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    id, member_id, project_id || null, date,
    tasks_completed || 0, hours_spent || 0, budget_used || 0, breaks_taken || 0, notes || ''
  );

  const member = db.prepare('SELECT name FROM members WHERE id=?').get(member_id);
  logActivity({
    type: 'log_entry',
    actor_name: member?.name || 'Someone',
    project_id: project_id || null,
    message: `logged a daily update (${tasks_completed || 0} tasks, ${hours_spent || 0}h)`
  });

  res.json(db.prepare('SELECT * FROM daily_logs WHERE id=?').get(id));
});

router.put('/:id', (req, res) => {
  const { tasks_completed, hours_spent, budget_used, breaks_taken, notes } = req.body;
  const existing = db.prepare('SELECT * FROM daily_logs WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE daily_logs SET
      tasks_completed=?, hours_spent=?, budget_used=?, breaks_taken=?, notes=?
    WHERE id=?
  `).run(
    tasks_completed ?? existing.tasks_completed,
    hours_spent ?? existing.hours_spent,
    budget_used ?? existing.budget_used,
    breaks_taken ?? existing.breaks_taken,
    notes ?? existing.notes,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM daily_logs WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM daily_logs WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;