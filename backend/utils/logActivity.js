const db = require('../database');
const { v4: uuidv4 } = require('uuid');

function logActivity({ type, actor_name, project_id, message }) {
  db.prepare(`
    INSERT INTO activity_log (id, type, actor_name, project_id, message)
    VALUES (?,?,?,?,?)
  `).run(uuidv4(), type, actor_name || null, project_id || null, message);
}

module.exports = { logActivity };