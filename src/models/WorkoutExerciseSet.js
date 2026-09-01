const { db } = require('../db/db');

function create(sessionId, routineExerciseId, setNumber, kg, reps, completed = 0) {
  const stmt = db.prepare(`
    INSERT INTO workout_exercise_sets (session_id, routine_exercise_id, set_number, kg, reps, completed)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(sessionId, routineExerciseId, setNumber, kg, reps, completed);
  return info.lastInsertRowid;
}

function findBySession(sessionId) {
  const stmt = db.prepare(`
    SELECT wes.*, re.exercise_id, e.name as exercise_name
    FROM workout_exercise_sets wes
    JOIN routine_exercises re ON wes.routine_exercise_id = re.id
    JOIN exercises e ON re.exercise_id = e.id
    WHERE wes.session_id = ?
    ORDER BY re.order_index, wes.set_number
  `);
  return stmt.all(sessionId);
}

function updateSet(id, kg, reps, completed) {
  const stmt = db.prepare(`
    UPDATE workout_exercise_sets SET kg = ?, reps = ?, completed = ?
    WHERE id = ?
  `);
  stmt.run(kg, reps, completed, id);
}

// NUEVO: Obtener último valor para un routine_exercise_id y set_number específico
function getLastValuesForRoutineExerciseAndSet(routineExerciseId, setNumber, userId) {
  const stmt = db.prepare(`
    SELECT wes.kg, wes.reps
    FROM workout_exercise_sets wes
    JOIN workout_sessions ws ON wes.session_id = ws.id
    WHERE wes.routine_exercise_id = ? AND wes.set_number = ? AND ws.user_id = ?
    ORDER BY ws.start_time DESC
    LIMIT 1
  `);
  return stmt.get(routineExerciseId, setNumber, userId);
}

function getLastValuesForExercise(exerciseId, userId) {
  const stmt = db.prepare(`
    SELECT wes.kg, wes.reps
    FROM workout_exercise_sets wes
    JOIN routine_exercises re ON wes.routine_exercise_id = re.id
    JOIN workout_sessions ws ON wes.session_id = ws.id
    WHERE re.exercise_id = ? AND ws.user_id = ?
    ORDER BY ws.start_time DESC
    LIMIT 1
  `);
  return stmt.get(exerciseId, userId);
}

module.exports = {
  create,
  findBySession,
  updateSet,
  getLastValuesForRoutineExerciseAndSet,
  getLastValuesForExercise,
};
