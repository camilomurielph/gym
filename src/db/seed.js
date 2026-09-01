const { db } = require('./db');

const ejercicios = [
  { name: 'Press de banca', category: 'Pecho', muscle_group: 'Pectorales' },
  { name: 'Press inclinado', category: 'Pecho', muscle_group: 'Pectorales' },
  { name: 'Aperturas con mancuernas', category: 'Pecho', muscle_group: 'Pectorales' },
  { name: 'Sentadilla con barra', category: 'Piernas', muscle_group: 'Cuádriceps' },
  { name: 'Sentadilla búlgara', category: 'Piernas', muscle_group: 'Cuádriceps' },
  { name: 'Prensa de piernas', category: 'Piernas', muscle_group: 'Cuádriceps' },
  { name: 'Peso muerto', category: 'Espalda', muscle_group: 'Espalda baja' },
  { name: 'Dominadas', category: 'Espalda', muscle_group: 'Dorsales' },
  { name: 'Remo con barra', category: 'Espalda', muscle_group: 'Dorsales' },
  { name: 'Remo con mancuerna', category: 'Espalda', muscle_group: 'Dorsales' },
  { name: 'Jalón al pecho', category: 'Espalda', muscle_group: 'Dorsales' },
  { name: 'Press militar', category: 'Hombros', muscle_group: 'Deltoides' },
  { name: 'Elevaciones laterales', category: 'Hombros', muscle_group: 'Deltoides' },
  { name: 'Elevaciones frontales', category: 'Hombros', muscle_group: 'Deltoides' },
  { name: 'Curl de bíceps con barra', category: 'Brazos', muscle_group: 'Bíceps' },
  { name: 'Curl de bíceps con mancuerna', category: 'Brazos', muscle_group: 'Bíceps' },
  { name: 'Martillo', category: 'Brazos', muscle_group: 'Bíceps' },
  { name: 'Extensiones de tríceps en polea', category: 'Brazos', muscle_group: 'Tríceps' },
  { name: 'Fondos en paralelas', category: 'Brazos', muscle_group: 'Tríceps' },
  { name: 'Press francés', category: 'Brazos', muscle_group: 'Tríceps' },
  { name: 'Elevaciones de gemelos', category: 'Piernas', muscle_group: 'Gemelos' },
  { name: 'Plancha', category: 'Abdomen', muscle_group: 'Core' },
  { name: 'Crunch', category: 'Abdomen', muscle_group: 'Abdomen' },
  { name: 'Elevación de piernas', category: 'Abdomen', muscle_group: 'Abdomen' },
  { name: 'Peso muerto rumano', category: 'Piernas', muscle_group: 'Isquiotibiales' },
];

function seedExercises() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM exercises');
  const { count } = stmt.get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO exercises (name, description, category, muscle_group)
    VALUES (?, ?, ?, ?)
  `);
  const insertMany = db.transaction((exercises) => {
    for (const ex of exercises) {
      insert.run(ex.name, '', ex.category, ex.muscle_group);
    }
  });
  insertMany(ejercicios);
  console.log('Ejercicios sembrados correctamente.');
}

module.exports = { seedExercises };
