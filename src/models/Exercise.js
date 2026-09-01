const { db } = require('../db/db');

function findAll() {
  const stmt = db.prepare('SELECT * FROM exercises ORDER BY name');
  return stmt.all();
}

function findById(id) {
  const stmt = db.prepare('SELECT * FROM exercises WHERE id = ?');
  return stmt.get(id);
}

module.exports = { findAll, findById };
