const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { logActivity } = require('./activity');

router.get('/', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { project_id, title, description, priority, assignee, due_date, estimated_hours } = req.body;

  if (!project_id || !title || !title.trim()) {
    return res.status(400).json({ error: 'project_id and title are required' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, priority, assignee, due_date, estimated_hours)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(id, project_id, title, description || '', priority || 'medium', assignee || null, due_date || null, estimated_hours || 0);

  const project = db.prepare('SELECT name FROM projects WHERE id=?').get(project_id);
  logActivity({
    type: 'task_created',
    actor_name: assignee || 'You',
    project_id,
    message: `created task "${title}"${project ? ` in "${project.name}"` : ''}`
  });

  res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(id));
});

router.put('/:id', (req, res) => {
  const { title, description, status, priority, assignee, due_date, estimated_hours } = req.body;

  const existing = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE tasks SET
      title=?, description=?, status=?, priority=?, assignee=?, due_date=?, estimated_hours=?
    WHERE id=?
  `).run(
    title ?? existing.title,
    description ?? existing.description,
    status ?? existing.status,
    priority ?? existing.priority,
    assignee ?? existing.assignee,
    due_date ?? existing.due_date,
    estimated_hours ?? existing.estimated_hours,
    req.params.id
  );

  if (status && status === 'done' && existing.status !== 'done') {
    const project = db.prepare('SELECT name FROM projects WHERE id=?').get(existing.project_id);
    logActivity({
      type: 'task_done',
      actor_name: existing.assignee || 'Someone',
      project_id: existing.project_id,
      message: `completed task "${existing.title}"${project ? ` in "${project.name}"` : ''}`
    });
  }

  res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;