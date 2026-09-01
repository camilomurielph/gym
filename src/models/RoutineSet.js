const { db } = require('../db/db');

function create(routineExerciseId, setNumber, kg, reps) {
  const stmt = db.prepare(`
    INSERT INTO routine_sets (routine_exercise_id, set_number, kg, reps)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(routineExerciseId, setNumber, kg, reps);
  return info.lastInsertRowid;
}

function findByRoutineExercise(routineExerciseId) {
  const stmt = db.prepare('SELECT * FROM routine_sets WHERE routine_exercise_id = ? ORDER BY set_number');
  return stmt.all(routineExerciseId);
}

function deleteByRoutineExercise(routineExerciseId) {
  const stmt = db.prepare('DELETE FROM routine_sets WHERE routine_exercise_id = ?');
  stmt.run(routineExerciseId);
}

function update(id, kg, reps) {
  const stmt = db.prepare('UPDATE routine_sets SET kg = ?, reps = ? WHERE id = ?');
  stmt.run(kg, reps, id);
}

module.exports = { create, findByRoutineExercise, deleteByRoutineExercise, update };
