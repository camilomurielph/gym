// Estado global
let token = localStorage.getItem('token');
let user = null;
let currentView = 'login'; // login, register, routines, edit, workout

// Elementos DOM
const main = document.getElementById('main-content');
const usernameSpan = document.getElementById('username');
const userInfoDiv = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');

// Utilidades
function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      return data;
    });
}

// Navegación
function navigate(view, data = null) {
  currentView = view;
  switch(view) {
    case 'login': renderLogin(); break;
    case 'register': renderRegister(); break;
    case 'routines': renderRoutines(); break;
    case 'edit': renderEdit(data); break;
    case 'workout': renderWorkout(data); break;
    default: renderLogin();
  }
}

// Autenticación
function setAuth(tokenValue, userData) {
  token = tokenValue;
  user = userData;
  localStorage.setItem('token', token);
  usernameSpan.textContent = user.username;
  userInfoDiv.style.display = 'flex';
  navigate('routines');
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem('token');
  userInfoDiv.style.display = 'none';
  navigate('login');
}

logoutBtn.addEventListener('click', logout);

// Verificar token al cargar
if (token) {
  // Podríamos validar el token con una llamada a /me, pero por simplicidad lo damos por bueno
  // y forzamos login si falla. Mejor ir a routines y si da error 401, logout.
  apiFetch('/api/routines')
    .then(() => {
      // Asumimos que el token es válido, pero necesitamos el username. Lo guardamos en localStorage o lo pedimos.
      // Podríamos tener un endpoint /me. Para simplificar, almacenamos el username al hacer login.
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser) {
        user = storedUser;
        usernameSpan.textContent = user.username;
        userInfoDiv.style.display = 'flex';
        navigate('routines');
      } else {
        logout();
      }
    })
    .catch(() => logout());
} else {
  navigate('login');
}

// Vistas
function renderLogin() {
  main.innerHTML = `
    <div class="card">
      <h2>Iniciar sesión</h2>
      <form id="login-form">
        <div class="form-group">
          <label>Usuario</label>
          <input type="text" id="login-username" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="login-password" required>
        </div>
        <button type="submit" style="width:100%;">Entrar</button>
      </form>
      <p style="margin-top:1rem;text-align:center;">
        ¿No tienes cuenta? <a href="#" id="go-to-register">Regístrate</a>
      </p>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuth(data.token, data.user);
    } catch (err) {
      alert(err.message);
    }
  });
  document.getElementById('go-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('register');
  });
}

function renderRegister() {
  main.innerHTML = `
    <div class="card">
      <h2>Registro</h2>
      <form id="register-form">
        <div class="form-group">
          <label>Usuario</label>
          <input type="text" id="register-username" required>
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" id="register-password" required>
        </div>
        <button type="submit" style="width:100%;">Crear cuenta</button>
      </form>
      <p style="margin-top:1rem;text-align:center;">
        ¿Ya tienes cuenta? <a href="#" id="go-to-login">Inicia sesión</a>
      </p>
    </div>
  `;
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuth(data.token, data.user);
    } catch (err) {
      alert(err.message);
    }
  });
  document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('login');
  });
}

// Rutinas
async function renderRoutines() {
  try {
    const routines = await apiFetch('/api/routines');
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2>Mis rutinas</h2>
        <button id="create-routine-btn" class="success">+ Crear</button>
      </div>
    `;
    if (routines.length === 0) {
      html += `<p>No tienes rutinas creadas.</p>`;
    } else {
      html += `<div class="card">`;
      routines.forEach(r => {
        html += `
          <div class="routine-item">
            <div class="info">
              <div class="name">${r.name}</div>
              <div class="date">${new Date(r.created_at).toLocaleDateString()}</div>
            </div>
            <div class="actions">
              <button class="secondary" data-id="${r.id}" data-action="start">Comenzar</button>
              <button class="secondary" data-id="${r.id}" data-action="edit">Editar</button>
              <button class="danger" data-id="${r.id}" data-action="delete">Eliminar</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }
    main.innerHTML = html;

    document.getElementById('create-routine-btn').addEventListener('click', () => navigate('edit', { mode: 'create' }));

    document.querySelectorAll('[data-action="start"]').forEach(btn => {
      btn.addEventListener('click', () => startRoutine(btn.dataset.id));
    });
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => navigate('edit', { mode: 'edit', routineId: btn.dataset.id }));
    });
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Eliminar esta rutina?')) {
          await apiFetch(`/api/routines/${btn.dataset.id}`, { method: 'DELETE' });
          renderRoutines();
        }
      });
    });
  } catch (err) {
    if (err.message === 'No autorizado' || err.status === 401) {
      logout();
    } else {
      alert(err.message);
    }
  }
}

// Editar/Crear rutina
async function renderEdit(data) {
  const mode = data.mode;
  const routineId = data.routineId;
  let routine = null;
  let exercisesList = [];

  try {
    exercisesList = await apiFetch('/api/exercises');
    if (mode === 'edit' && routineId) {
      routine = await apiFetch(`/api/routines/${routineId}`);
    }
  } catch (err) {
    alert(err.message);
    return;
  }

  // Estado local del editor
  const state = {
    name: routine ? routine.name : '',
    exercises: routine ? routine.exercises.map(ex => ({
      exerciseId: ex.exercise_id,
      exerciseName: ex.exercise_name,
      sets: ex.sets.map(s => ({ kg: s.kg, reps: s.reps }))
    })) : []
  };

  function renderEditor() {
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2>${mode === 'create' ? 'Crear rutina' : 'Editar rutina'}</h2>
        <button id="back-to-routines" class="secondary">← Volver</button>
      </div>
      <div class="card">
        <div class="form-group">
          <label>Nombre de la rutina</label>
          <input type="text" id="routine-name" value="${state.name}" placeholder="Ej: Push Day">
        </div>
        <div style="margin-top:1rem;">
          <h4>Ejercicios</h4>
          <div id="exercises-container">
            ${state.exercises.map((ex, idx) => `
              <div class="exercise-block" data-index="${idx}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong>${ex.exerciseName}</strong>
                  <button class="danger remove-exercise" data-index="${idx}">✕</button>
                </div>
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr><th>Serie</th><th>KG</th><th>Reps</th></tr>
                    </thead>
                    <tbody>
                      ${ex.sets.map((set, sidx) => `
                        <tr>
                          <td>${sidx+1}</td>
                          <td><input type="text" class="set-kg" data-exindex="${idx}" data-setindex="${sidx}" value="${set.kg || ''}" placeholder="kg"></td>
                          <td><input type="text" class="set-reps" data-exindex="${idx}" data-setindex="${sidx}" value="${set.reps || ''}" placeholder="ej. 12 o 6-8"></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <button class="add-btn add-set" data-exindex="${idx}">(+) Agregar Serie</button>
              </div>
            `).join('')}
          </div>
          <button class="add-btn" id="add-exercise-btn">(+) Agregar Ejercicio</button>
        </div>
        <button id="save-routine-btn" class="success" style="width:100%;margin-top:1rem;">Guardar rutina</button>
      </div>
    `;
    main.innerHTML = html;

    // Eventos
    document.getElementById('back-to-routines').addEventListener('click', () => navigate('routines'));
    document.getElementById('routine-name').addEventListener('input', (e) => state.name = e.target.value);

    // Agregar serie
    document.querySelectorAll('.add-set').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.exindex);
        state.exercises[idx].sets.push({ kg: '', reps: '' });
        renderEditor();
      });
    });

    // Eliminar ejercicio
    document.querySelectorAll('.remove-exercise').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        state.exercises.splice(idx, 1);
        renderEditor();
      });
    });

    // Agregar ejercicio (muestra modal o select)
    document.getElementById('add-exercise-btn').addEventListener('click', () => {
      // Mostrar un selector de ejercicios
      const selectHtml = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;">
          <div style="background:white;padding:1.5rem;border-radius:12px;width:90%;max-width:400px;">
            <h4>Seleccionar ejercicio</h4>
            <select id="exercise-select" style="width:100%;padding:0.5rem;margin:1rem 0;">
              ${exercisesList.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
            </select>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
              <button id="cancel-select" class="secondary">Cancelar</button>
              <button id="confirm-select" class="success">Agregar</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', selectHtml);
      document.getElementById('cancel-select').addEventListener('click', () => {
        document.body.lastElementChild.remove();
      });
      document.getElementById('confirm-select').addEventListener('click', () => {
        const exerciseId = parseInt(document.getElementById('exercise-select').value);
        const exercise = exercisesList.find(e => e.id === exerciseId);
        if (exercise) {
          state.exercises.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: [{ kg: '', reps: '' }]
          });
          renderEditor();
        }
        document.body.lastElementChild.remove();
      });
    });

    // Guardar
    document.getElementById('save-routine-btn').addEventListener('click', async () => {
      // Recolectar datos de los inputs
      const name = document.getElementById('routine-name').value.trim();
      if (!name) { alert('Ingresa un nombre'); return; }
      const exercisesData = [];
      document.querySelectorAll('.exercise-block').forEach((block, idx) => {
        const exId = state.exercises[idx].exerciseId;
        const sets = [];
        block.querySelectorAll('tbody tr').forEach((row, sidx) => {
          const kg = row.querySelector('.set-kg').value;
          const reps = row.querySelector('.set-reps').value;
          sets.push({ kg: kg || null, reps: reps || '' });
        });
        exercisesData.push({ exerciseId: exId, sets });
      });
      if (exercisesData.length === 0) { alert('Agrega al menos un ejercicio'); return; }

      try {
        if (mode === 'create') {
          await apiFetch('/api/routines', {
            method: 'POST',
            body: JSON.stringify({ name, exercises: exercisesData })
          });
        } else {
          await apiFetch(`/api/routines/${routineId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, exercises: exercisesData })
          });
        }
        navigate('routines');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  renderEditor();
}

// Comenzar rutina
async function startRoutine(routineId) {
  try {
    const data = await apiFetch(`/api/workouts/routines/${routineId}/start`, { method: 'POST' });
    navigate('workout', data);
  } catch (err) {
    alert(err.message);
  }
}

// Vista de entrenamiento
function renderWorkout(data) {
  const sessionId = data.session_id;
  const exercises = data.exercises;
  let timerInterval = null;
  let startTime = Date.now();

  function renderWorkoutView() {
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2>🏃 Entrenando</h2>
        <span class="timer" id="timer">00:00</span>
      </div>
    `;

    exercises.forEach(ex => {
      html += `
        <div class="exercise-block">
          <h4>${ex.exercise_name}</h4>
          <div class="table-responsive">
            <table>
              <thead>
                <tr><th>Serie</th><th>Anterior</th><th>KG</th><th>Reps</th><th>✓</th></tr>
              </thead>
              <tbody>
                ${ex.sets.map((set, idx) => `
                  <tr data-setid="${set.id}">
                    <td>${set.set_number}</td>
                    <td>${set.last_kg !== null ? `${set.last_kg}kg x ${set.last_reps}` : '-'}</td>
                    <td>
                      <input type="text" class="workout-kg" value="${set.kg !== null ? set.kg : ''}" placeholder="${set.default_kg !== null ? set.default_kg : ''}" style="width:70px;">
                      <span class="default-hint">${set.default_kg !== null ? `(por defecto ${set.default_kg})` : ''}</span>
                    </td>
                    <td>
                      <input type="text" class="workout-reps" value="${set.reps || ''}" placeholder="${set.default_reps || ''}" style="width:70px;">
                      <span class="default-hint">${set.default_reps ? `(por defecto ${set.default_reps})` : ''}</span>
                    </td>
                    <td><input type="checkbox" class="workout-completed" ${set.completed ? 'checked' : ''}></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    html += `
      <button id="finish-workout-btn" class="success" style="width:100%;margin-top:1rem;">Terminar entrenamiento</button>
    `;

    main.innerHTML = html;

    // Iniciar timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      document.getElementById('timer').textContent = `${mins}:${secs}`;
    }, 1000);

    // Evento terminar
    document.getElementById('finish-workout-btn').addEventListener('click', async () => {
      if (!confirm('¿Finalizar entrenamiento?')) return;
      // Recolectar datos actuales de los inputs
      const updates = [];
      document.querySelectorAll('tbody tr').forEach(row => {
        const setid = parseInt(row.dataset.setid);
        const kg = row.querySelector('.workout-kg').value;
        const reps = row.querySelector('.workout-reps').value;
        const completed = row.querySelector('.workout-completed').checked ? 1 : 0;
        updates.push({ id: setid, kg, reps, completed });
      });
      // Enviar actualizaciones (opcional, podemos enviar todas al final)
      // Para simplificar, enviamos cada set actualizado (o podríamos tener un endpoint batch)
      // Usaremos el endpoint de actualización individual
      try {
        for (const upd of updates) {
          await apiFetch(`/api/workouts/sets/${upd.id}`, {
            method: 'PUT',
            body: JSON.stringify({ kg: upd.kg, reps: upd.reps, completed: upd.completed })
          });
        }
        // Finalizar sesión
        await apiFetch(`/api/workouts/sessions/${sessionId}/finish`, { method: 'POST' });
        clearInterval(timerInterval);
        alert('¡Entrenamiento finalizado!');
        navigate('routines');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  renderWorkoutView();
}
