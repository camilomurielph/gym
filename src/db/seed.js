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
  // Verificar si ya hay ejercicios
  const stmt = db.prepare('SELECT COUNT(*) as count FROM exercises');
  const { count } = stmt.get();
  console.log(`📊 Ejercicios existentes: ${count}`);

  if (count > 0) {
    console.log('✅ Los ejercicios ya están sembrados. No se hace nada.');
    // Mostrar algunos IDs para depuración
    const sample = db.prepare('SELECT id, name FROM exercises LIMIT 5').all();
    console.log('📋 Muestra de ejercicios:', sample);
    return;
  }

  console.log('🌱 Sembrando ejercicios por primera vez...');
  const insert = db.prepare(`
    INSERT INTO exercises (name, description, category, muscle_group)
    VALUES (?, ?, ?, ?)
  `);
  const insertMany = db.transaction((exercises) => {
    for (const ex of exercises) {
      insert.run(ex.name, '', ex.category, ex.muscle_group);
    }
  });

  try {
    insertMany(ejercicios);
    console.log(`✅ ${ejercicios.length} ejercicios sembrados correctamente.`);
    // Verificar
    const all = db.prepare('SELECT id, name FROM exercises').all();
    console.log('📋 Ejercicios en DB:', all);
  } catch (err) {
    console.error('❌ Error al sembrar ejercicios:', err);
  }
}

module.exports = { seedExercises };
