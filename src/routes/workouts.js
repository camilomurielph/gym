const express = require('express');
const { authenticate } = require('../middleware/auth');
const Routine = require('../models/Routine');
const RoutineExercise = require('../models/RoutineExercise');
const RoutineSet = require('../models/RoutineSet');
const WorkoutSession = require('../models/WorkoutSession');
const WorkoutExerciseSet = require('../models/WorkoutExerciseSet');

const router = express.Router();

// Iniciar sesión de entrenamiento
router.post('/routines/:id/start', authenticate, (req, res) => {
  const routineId = parseInt(req.params.id);
  const routine = Routine.findById(routineId);
  if (!routine || routine.user_id !== req.userId) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  // Crear sesión
  const sessionId = WorkoutSession.create(req.userId, routineId);

  // Obtener ejercicios de la rutina
  const routineExercises = RoutineExercise.findByRoutine(routineId);
  const sessionData = [];

  routineExercises.forEach(re => {
    const sets = RoutineSet.findByRoutineExercise(re.id);
    const exerciseName = re.exercise_name;
    const exerciseId = re.exercise_id;

    // Para cada set, obtener último valor de sesión anterior (para "Anterior")
    const setData = sets.map(set => {
      // Buscar último valor de este mismo routine_exercise en sesiones anteriores
      const last = WorkoutExerciseSet.getLastValuesForRoutineExercise(re.id, req.userId);
      const defaultKg = set.kg;
      const defaultReps = set.reps;
      const lastKg = last ? last.kg : null;
      const lastReps = last ? last.reps : null;

      // Crear registro en workout_exercise_sets
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

// Actualizar un set durante la sesión (opcional, se puede usar para guardar cambios en tiempo real)
router.put('/sets/:id', authenticate, (req, res) => {
  const { kg, reps, completed } = req.body;
  const set = WorkoutExerciseSet.updateSet(req.params.id, kg, reps, completed);
  res.json({ success: true });
});

// Finalizar sesión
router.post('/sessions/:id/finish', authenticate, (req, res) => {
  const sessionId = parseInt(req.params.id);
  const session = WorkoutSession.findById(sessionId);
  if (!session || session.user_id !== req.userId) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }
  // Calcular duración en segundos (diferencia entre start_time y now)
  const start = new Date(session.start_time);
  const now = new Date();
  const duration = Math.floor((now - start) / 1000);
  WorkoutSession.finish(sessionId, duration);
  res.json({ success: true, duration });
});

module.exports = router;
