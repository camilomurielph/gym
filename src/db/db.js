const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// ¡ACTIVAR CLAVES FORÁNEAS! (desactivadas por defecto en SQLite)
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      muscle_group TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS routine_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      kg REAL,
      reps TEXT,
      FOREIGN KEY (routine_exercise_id) REFERENCES routine_exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      routine_id INTEGER NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      duration_seconds INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (routine_id) REFERENCES routines(id)
    );

    CREATE TABLE IF NOT EXISTS workout_exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      routine_exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      kg REAL,
      reps TEXT,
      completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (routine_exercise_id) REFERENCES routine_exercises(id)
    );
  `);
}

module.exports = { db, initDb };
