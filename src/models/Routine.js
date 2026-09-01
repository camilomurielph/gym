const { db } = require('../db/db');

function findByUser(userId) {
  const stmt = db.prepare('SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
}

function create(userId, name) {
  const stmt = db.prepare('INSERT INTO routines (user_id, name) VALUES (?, ?)');
  const info = stmt.run(userId, name);
  return info.lastInsertRowid;
}

function findById(id) {
  const stmt = db.prepare('SELECT * FROM routines WHERE id = ?');
  return stmt.get(id);
}

function update(id, name) {
  const stmt = db.prepare('UPDATE routines SET name = ? WHERE id = ?');
  stmt.run(name, id);
}

function remove(id) {
  const stmt = db.prepare('DELETE FROM routines WHERE id = ?');
  stmt.run(id);
}

module.exports = { findByUser, create, findById, update, remove };
