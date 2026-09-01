const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const routineRoutes = require('./routes/routines');
const workoutRoutes = require('./routes/workouts');
const { initDb } = require('./db/db');
const { seedExercises } = require('./db/seed');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Inicializar DB y sembrar ejercicios
initDb();
seedExercises();

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/workouts', workoutRoutes);

// Ruta para SPA (cualquier otra ruta devuelve index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================================
// MIDDLEWARE DE MANEJO DE ERRORES (DEBE IR AL FINAL)
// ============================================================
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  // Siempre devolver JSON, incluso si el error es 500
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
