const express = require('express');
const { authenticate } = require('../middleware/auth');
const Routine = require('../models/Routine');
const RoutineExercise = require('../models/RoutineExercise');
const RoutineSet = require('../models/RoutineSet');
const { db } = require('../db/db');

const router = express.Router();

// Obtener todas las rutinas del usuario
router.get('/', authenticate, (req, res) => {
  try {
    const routines = Routine.findByUser(req.userId);
    res.json(routines);
  } catch (err) {
    console.error('Error al obtener rutinas:', err);
    res.status(500).json({ error: 'Error interno al obtener rutinas' });
  }
});

// Obtener una rutina con detalles
router.get('/:id', authenticate, (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error al obtener rutina:', err);
    res.status(500).json({ error: 'Error interno al obtener la rutina' });
  }
});

// Crear rutina (con transacción y validaciones)
router.post('/', authenticate, (req, res) => {
  const { name, exercises } = req.body;

  // Validaciones básicas
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre de la rutina es obligatorio' });
  }
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: 'Debes incluir al menos un ejercicio' });
  }

  // Validar cada ejercicio
  for (const ex of exercises) {
    if (!ex.exerciseId || !ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0) {
      return res.status(400).json({ error: 'Cada ejercicio debe tener un ID y al menos una serie' });
    }
    for (const set of ex.sets) {
      // kg puede ser número o null, reps puede ser string o número
      if (set.kg !== undefined && set.kg !== null && isNaN(parseFloat(set.kg))) {
        return res.status(400).json({ error: 'El KG debe ser un número válido' });
      }
      if (set.reps !== undefined && set.reps !== null && typeof set.reps !== 'string' && typeof set.reps !== 'number') {
        return res.status(400).json({ error: 'Las repeticiones deben ser texto o número' });
      }
    }
  }

  // Usar transacción para evitar datos inconsistentes
  const insertRoutine = db.transaction(() => {
    const routineId = Routine.create(req.userId, name.trim());
    exercises.forEach((ex, index) => {
      const reId = RoutineExercise.create(routineId, ex.exerciseId, index);
      ex.sets.forEach((set, idx) => {
        const kg = set.kg !== undefined && set.kg !== null && set.kg !== '' ? parseFloat(set.kg) : null;
        const reps = set.reps !== undefined && set.reps !== null ? String(set.reps) : '';
        RoutineSet.create(reId, idx + 1, kg, reps);
      });
    });
    return routineId;
  });

  try {
    const routineId = insertRoutine();
    res.status(201).json({ id: routineId, message: 'Rutina creada correctamente' });
  } catch (err) {
    console.error('Error al crear rutina:', err);
    res.status(500).json({ error: 'Error al guardar la rutina: ' + err.message });
  }
});

// Actualizar rutina (borra y recrea)
router.put('/:id', authenticate, (req, res) => {
  const routineId = parseInt(req.params.id);
  const { name, exercises } = req.body;

  // Validaciones
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre de la rutina es obligatorio' });
  }
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: 'Debes incluir al menos un ejercicio' });
  }

  for (const ex of exercises) {
    if (!ex.exerciseId || !ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0) {
      return res.status(400).json({ error: 'Cada ejercicio debe tener un ID y al menos una serie' });
    }
    for (const set of ex.sets) {
      if (set.kg !== undefined && set.kg !== null && isNaN(parseFloat(set.kg))) {
        return res.status(400).json({ error: 'El KG debe ser un número válido' });
      }
    }
  }

  // Verificar que la rutina existe y pertenece al usuario
  const routine = Routine.findById(routineId);
  if (!routine || routine.user_id !== req.userId) {
    return res.status(404).json({ error: 'Rutina no encontrada o no autorizada' });
  }

  // Usar transacción
  const updateRoutine = db.transaction(() => {
    // Actualizar nombre
    Routine.update(routineId, name.trim());

    // Eliminar ejercicios y sets existentes
    const existing = RoutineExercise.findByRoutine(routineId);
    existing.forEach(re => {
      RoutineSet.deleteByRoutineExercise(re.id);
    });
    RoutineExercise.deleteByRoutine(routineId);

    // Insertar nuevos
    exercises.forEach((ex, index) => {
      const reId = RoutineExercise.create(routineId, ex.exerciseId, index);
      ex.sets.forEach((set, idx) => {
        const kg = set.kg !== undefined && set.kg !== null && set.kg !== '' ? parseFloat(set.kg) : null;
        const reps = set.reps !== undefined && set.reps !== null ? String(set.reps) : '';
        RoutineSet.create(reId, idx + 1, kg, reps);
      });
    });
  });

  try {
    updateRoutine();
    res.json({ success: true, message: 'Rutina actualizada correctamente' });
  } catch (err) {
    console.error('Error al actualizar rutina:', err);
    res.status(500).json({ error: 'Error al guardar la rutina: ' + err.message });
  }
});

// Eliminar rutina
router.delete('/:id', authenticate, (req, res) => {
  try {
    const routine = Routine.findById(req.params.id);
    if (!routine || routine.user_id !== req.userId) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }
    Routine.remove(routine.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar rutina:', err);
    res.status(500).json({ error: 'Error interno al eliminar' });
  }
});

module.exports = router;
