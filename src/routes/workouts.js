const express = require('express');
const { authenticate } = require('../middleware/auth');
const Routine = require('../models/Routine');
const RoutineExercise = require('../models/RoutineExercise');
const RoutineSet = require('../models/RoutineSet');
const WorkoutSession = require('../models/WorkoutSession');
const WorkoutExerciseSet = require('../models/WorkoutExerciseSet');
const { db } = require('../db/db');

const router = express.Router();

// Iniciar sesión de entrenamiento
router.post('/routines/:id/start', authenticate, (req, res) => {
  const routineId = parseInt(req.params.id);
  const routine = Routine.findById(routineId);
  if (!routine || routine.user_id !== req.userId) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  const sessionId = WorkoutSession.create(req.userId, routineId);
  const routineExercises = RoutineExercise.findByRoutine(routineId);
  const sessionData = [];

  routineExercises.forEach(re => {
    const sets = RoutineSet.findByRoutineExercise(re.id);
    const exerciseName = re.exercise_name;
    const exerciseId = re.exercise_id;

    const setData = sets.map(set => {
      // Obtener último valor para este routine_exercise Y este set_number
      const last = WorkoutExerciseSet.getLastValuesForRoutineExerciseAndSet(
        re.id,
        set.set_number,
        req.userId
      );
      const defaultKg = set.kg;
      const defaultReps = set.reps;
      const lastKg = last ? last.kg : null;
      const lastReps = last ? last.reps : null;

      const currentKg = lastKg !== null ? lastKg : defaultKg;
      const currentReps = lastReps !== null ? lastReps : defaultReps;
      const wesId = WorkoutExerciseSet.create(
        sessionId,
        re.id,
        set.set_number,
        currentKg,
        currentReps,
        0
      );

      return {
        id: wesId,
        set_number: set.set_number,
        default_kg: defaultKg,
        default_reps: defaultReps,
        last_kg: lastKg,
        last_reps: lastReps,
        kg: currentKg,
        reps: currentReps,
        completed: 0
      };
    });

    sessionData.push({
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      routine_exercise_id: re.id,
      sets: setData
    });
  });

  res.json({
    session_id: sessionId,
    exercises: sessionData
  });
});

// Actualizar un set (opcional)
router.put('/sets/:id', authenticate, (req, res) => {
  const { kg, reps, completed } = req.body;
  WorkoutExerciseSet.updateSet(req.params.id, kg, reps, completed);
  res.json({ success: true });
});

// Finalizar sesión
router.post('/sessions/:id/finish', authenticate, (req, res) => {
  const sessionId = parseInt(req.params.id);
  const session = WorkoutSession.findById(sessionId);
  if (!session || session.user_id !== req.userId) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }
  const start = new Date(session.start_time);
  const now = new Date();
  const duration = Math.floor((now - start) / 1000);
  WorkoutSession.finish(sessionId, duration);
  res.json({ success: true, duration });
});

// Obtener historial de sesiones
router.get('/sessions', authenticate, (req, res) => {
  const sessions = db.prepare(`
    SELECT ws.*, r.name as routine_name
    FROM workout_sessions ws
    JOIN routines r ON ws.routine_id = r.id
    WHERE ws.user_id = ?
    ORDER BY ws.start_time DESC
  `).all(req.userId);

  const sessionsWithDetails = sessions.map(session => {
    const sets = db.prepare(`
      SELECT wes.*, e.name as exercise_name
      FROM workout_exercise_sets wes
      JOIN routine_exercises re ON wes.routine_exercise_id = re.id
      JOIN exercises e ON re.exercise_id = e.id
      WHERE wes.session_id = ?
      ORDER BY re.order_index, wes.set_number
    `).all(session.id);
    return { ...session, sets };
  });

  res.json(sessionsWithDetails);
});

module.exports = router;
