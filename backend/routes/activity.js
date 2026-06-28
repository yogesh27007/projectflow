const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// ✅ Just import it, don't redefine it
const { logActivity } = require('../utils/logActivity');

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const rows = db.prepare(`
    SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?
  `).all(limit);
  res.json(rows);
});

// ❌ DELETE the function definition below — it's now in utils/logActivity.js
// function logActivity(...) { ... }  ← remove this entire block

module.exports = router; // ✅ just this, nothing else