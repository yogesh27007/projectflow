const express = require('express');
const cors = require('cors');
const app = express();
const { requireAuth } = require('./middleware/auth');

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Public routes - no login required
app.use('/api/auth', require('./routes/auth'));

// Everything below this line requires a valid token
app.use('/api/projects', requireAuth, require('./routes/projects'));
app.use('/api/tasks', requireAuth, require('./routes/tasks'));
app.use('/api/members', requireAuth, require('./routes/members'));
app.use('/api/activity', requireAuth, require('./routes/activity'));
app.use('/api/dailylogs', requireAuth, require('./routes/dailylogs'));

app.get('/api/stats', requireAuth, (req, res) => {
  const db = require('./database');
  res.json({
    projects: db.prepare('SELECT COUNT(*) as c FROM projects').get().c,
    tasks: db.prepare('SELECT COUNT(*) as c FROM tasks').get().c,
    done: db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='done'").get().c,
    members: db.prepare('SELECT COUNT(*) as c FROM members').get().c,
  });
});

app.listen(5000, () => console.log('Backend running at http://localhost:5000'));