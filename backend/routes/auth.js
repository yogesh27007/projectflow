const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)')
    .run(id, name.trim(), email.trim().toLowerCase(), password_hash);

  const token = jwt.sign({ id, name: name.trim(), email: email.trim().toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, name: name.trim(), email: email.trim().toLowerCase() } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;