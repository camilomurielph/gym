const { db } = require('../db/db');
const bcrypt = require('bcrypt');

function findByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

function create(username, passwordHash) {
  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const info = stmt.run(username, passwordHash);
  return info.lastInsertRowid;
}

function findById(id) {
  const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

module.exports = { findByUsername, create, findById };
