const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM members').all());
});

router.post('/', (req, res) => {
  const { name, email, role, avatar_color } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO members VALUES (?,?,?,?,?)').run(id, name, email, role || 'developer', avatar_color || '#6366f1');
  res.json(db.prepare('SELECT * FROM members WHERE id=?').get(id));
});

router.put('/:id', (req, res) => {
  const { name, email, role, avatar_color } = req.body;
  const existing = db.prepare('SELECT * FROM members WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare('UPDATE members SET name=?, email=?, role=?, avatar_color=? WHERE id=?').run(
    name ?? existing.name,
    email ?? existing.email,
    role ?? existing.role,
    avatar_color ?? existing.avatar_color,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM members WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM members WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;