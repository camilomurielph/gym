const { db } = require('../db/db');

function create(userId, routineId) {
  const stmt = db.prepare(`
    INSERT INTO workout_sessions (user_id, routine_id, start_time)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  const info = stmt.run(userId, routineId);
  return info.lastInsertRowid;
}

function findById(id) {
  const stmt = db.prepare('SELECT * FROM workout_sessions WHERE id = ?');
  return stmt.get(id);
}

function finish(id, durationSeconds) {
  const stmt = db.prepare(`
    UPDATE workout_sessions SET end_time = CURRENT_TIMESTAMP, duration_seconds = ?
    WHERE id = ?
  `);
  stmt.run(durationSeconds, id);
}

function getLastSessionByRoutine(routineId, userId) {
  const stmt = db.prepare(`
    SELECT * FROM workout_sessions
    WHERE routine_id = ? AND user_id = ?
    ORDER BY start_time DESC LIMIT 1
  `);
  return stmt.get(routineId, userId);
}

module.exports = { create, findById, finish, getLastSessionByRoutine };
