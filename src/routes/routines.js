const express = require('express');
const { authenticate } = require('../middleware/auth');
const Routine = require('../models/Routine');
const RoutineExercise = require('../models/RoutineExercise');
const RoutineSet = require('../models/RoutineSet');
const Exercise = require('../models/Exercise');
const WorkoutExerciseSet = require('../models/WorkoutExerciseSet');

const router = express.Router();

// Obtener todas las rutinas del usuario
router.get('/', authenticate, (req, res) => {
  const routines = Routine.findByUser(req.userId);
  res.json(routines);
});

// Obtener una rutina con sus ejercicios y sets
router.get('/:id', authenticate, (req, res) => {
  const routine = Routine.findById(req.params.id);
  if (!routine || routine.user_id !== req.userId) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }
  const exercises = RoutineExercise.findByRoutine(routine.id);
  const result = {
    ...routine,
    exercises: exercises.map(ex => {
      const sets = RoutineSet.findByRoutineExercise(ex.id);
      return { ...ex, sets };
    })
  };
  res.json(result);
});

// Crear rutina
router.post('/', authenticate, (req, res) => {
  const { name, exercises } = req.body; // exercises es array de { exerciseId, sets: [{kg, reps}] }
  if (!name || !exercises || !exercises.length) {
    return res.status(400).json({ error: 'Nombre y ejercicios son requeridos' });
  }
  const routineId = Routine.create(req.userId, name);
  exercises.forEach((ex, index) => {
    const reId = RoutineExercise.create(routineId, ex.exerciseId, index);
    ex.sets.forEach((set, idx) => {
      RoutineSet.create(reId, idx + 1, set.kg || null, set.reps || '');
    });
  });
  res.status(201).json({ id: routineId });
});

// Actualizar rutina (borra y recrea ejercicios/sets)
router.put('/:id', authenticate, (req, res) => {
  const routine = Routine.findById(req.params.id);
  if (!routine || routine.user_id !== req.userId) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }
  const { name, exercises } = req.body;
  Routine.update(routine.id, name);
  // Eliminar ejercicios y sets existentes
  const existing = RoutineExercise.findByRoutine(routine.id);
  existing.forEach(re => {
    RoutineSet.deleteByRoutineExercise(re.id);
  });
  RoutineExercise.deleteByRoutine(routine.id);
  // Insertar nuevos
  exercises.forEach((ex, index) => {
    const reId = RoutineExercise.create(routine.id, ex.exerciseId, index);
    ex.sets.forEach((set, idx) => {
      RoutineSet.create(reId, idx + 1, set.kg || null, set.reps || '');
    });
  });
  res.json({ success: true });
});

// Eliminar rutina
router.delete('/:id', authenticate, (req, res) => {
  const routine = Routine.findById(req.params.id);
  if (!routine || routine.user_id !== req.userId) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }
  Routine.remove(routine.id);
  res.json({ success: true });
});

module.exports = router;
