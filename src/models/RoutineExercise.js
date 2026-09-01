const { db } = require('../db/db');

function create(routineId, exerciseId, orderIndex) {
  const stmt = db.prepare(`
    INSERT INTO routine_exercises (routine_id, exercise_id, order_index)
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(routineId, exerciseId, orderIndex);
  return info.lastInsertRowid;
}

function findByRoutine(routineId) {
  const stmt = db.prepare(`
    SELECT re.*, e.name as exercise_name, e.category, e.muscle_group
    FROM routine_exercises re
    JOIN exercises e ON re.exercise_id = e.id
    WHERE re.routine_id = ?
    ORDER BY re.order_index
  `);
  return stmt.all(routineId);
}

function deleteByRoutine(routineId) {
  const stmt = db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?');
  stmt.run(routineId);
}

function findById(id) {
  const stmt = db.prepare('SELECT * FROM routine_exercises WHERE id = ?');
  return stmt.get(id);
}

module.exports = { create, findByRoutine, deleteByRoutine, findById };
