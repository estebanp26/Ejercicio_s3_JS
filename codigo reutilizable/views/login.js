// ============================================================
// src/views/login.js
// Vista de inicio de sesión.
// Renderiza el formulario de login y maneja la autenticación.
// ============================================================

import { login }        from '../api/auth.js'
import { saveSession }  from '../services/session.js'
import { navigate }     from '../src/router.js'
import { toastError }   from '../components/toast.js'

/**
 * Renderiza la vista de login en el #app.
 * Esta vista se muestra cuando el usuario no está autenticado.
 */
export function renderLogin() {
  // Obtenemos el elemento raíz de la SPA
  const app = document.getElementById('app')

  // Inyectamos el HTML del formulario de login
  app.innerHTML = `
    <div class="login-page">
      <div class="login-card">

        <!-- Logo y título -->
        <div class="login-brand">
          <div class="brand-icon-lg">🚀</div>
          <h1>ProjectHub</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <!-- Formulario de login -->
        <!-- Usamos div en lugar de form para evitar recargas de página -->
        <div class="login-form">

          <!-- Campo de email -->
          <div class="form-group">
            <label class="form-label" for="email">Correo electrónico</label>
            <input
              class="form-input"
              type="email"
              id="email"
              placeholder="manager@test.com"
              autocomplete="email"
            />
            <!-- Mensaje de error — visible solo cuando hay un error -->
            <span class="field-error" id="email-error">
              Ingresa un correo válido
            </span>
          </div>

          <!-- Campo de contraseña -->
          <div class="form-group">
            <label class="form-label" for="password">Contraseña</label>
            <input
              class="form-input"
              type="password"
              id="password"
              placeholder="••••••"
              autocomplete="current-password"
            />
            <span class="field-error" id="password-error">
              La contraseña es requerida
            </span>
          </div>

          <!-- Mensaje de error general (cuando falla la API) -->
          <div id="login-error"
               style="display:none; background:rgba(239,68,68,0.1);
                      border:1px solid rgba(239,68,68,0.3);
                      color:#dc2626; border-radius:6px;
                      padding:0.75rem 1rem; font-size:0.875rem;
                      margin-bottom:1rem;">
          </div>

          <!-- Botón de submit -->
          <button class="btn-primary btn-full" id="btn-login">
            Iniciar sesión
          </button>

          <!-- Credenciales de prueba (útil para la demo) -->
          <div style="margin-top:1.5rem; padding:1rem; background:var(--bg);
                      border-radius:8px; font-size:0.78rem; color:var(--text-muted);">
            <strong style="display:block; margin-bottom:0.5rem; color:var(--text);">
              👤 Usuarios de prueba:
            </strong>
            <div style="display:flex; flex-direction:column; gap:0.3rem;">
              <span>🔑 <strong>Manager:</strong> manager@test.com / 123456</span>
              <span>👥 <strong>Collaborator:</strong> user@test.com / 123456</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `

  // Registramos los eventos del formulario
  setupLoginEvents()
}

/**
 * Configura todos los event listeners del formulario de login.
 */
function setupLoginEvents() {
  // Obtenemos referencias a los elementos del DOM
  const emailInput    = document.getElementById('email')
  const passwordInput = document.getElementById('password')
  const btnLogin      = document.getElementById('btn-login')
  const loginError    = document.getElementById('login-error')
  const emailError    = document.getElementById('email-error')
  const passwordError = document.getElementById('password-error')

  // ── Evento: click en el botón de login ─────────────────────
  btnLogin.addEventListener('click', async () => {
    // Primero validamos los campos
    if (!validateForm()) return

    // Obtenemos los valores de los inputs
    const email    = emailInput.value.trim()
    const password = passwordInput.value

    // Deshabilitamos el botón para evitar doble submit
    btnLogin.disabled = true
    btnLogin.textContent = 'Iniciando sesión...'

    // Ocultamos el error previo si existía
    loginError.style.display = 'none'

    try {
      // Llamamos a la API de autenticación
      const user = await login(email, password)

      // Si el login fue exitoso, guardamos la sesión
      saveSession(user)

      // Redirigimos al dashboard
      navigate('#/dashboard')

    } catch (error) {
      // Si hubo un error, lo mostramos en el div de error
      loginError.style.display = 'block'
      loginError.textContent   = error.message

      // También mostramos un toast de error
      toastError(error.message)

    } finally {
      // finally se ejecuta siempre (con éxito o error)
      // Rehabilitamos el botón
      btnLogin.disabled    = false
      btnLogin.textContent = 'Iniciar sesión'
    }
  })

  // ── Evento: Enter en los inputs ─────────────────────────────
  // Permite hacer login presionando Enter sin necesidad del botón
  ;[emailInput, passwordInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btnLogin.click()           // Simula un click en el botón
      }
    })
  })

  // ── Evento: limpiar errores al escribir ─────────────────────
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error')
    emailError.classList.remove('visible')
  })

  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error')
    passwordError.classList.remove('visible')
  })
}

/**
 * Valida los campos del formulario de login.
 * @returns {boolean} true si todos los campos son válidos
 */
function validateForm() {
  const emailInput    = document.getElementById('email')
  const passwordInput = document.getElementById('password')
  const emailError    = document.getElementById('email-error')
  const passwordError = document.getElementById('password-error')

  let isValid = true  // Asumimos que todo está bien

  // Validar email
  const email = emailInput.value.trim()

  if (!email) {
    // El campo está vacío
    emailError.textContent = 'El correo es requerido'
    emailError.classList.add('visible')
    emailInput.classList.add('error')
    isValid = false

  } else if (!isValidEmail(email)) {
    // El email no tiene formato válido
    emailError.textContent = 'Ingresa un correo electrónico válido'
    emailError.classList.add('visible')
    emailInput.classList.add('error')
    isValid = false
  }

  // Validar contraseña
  const password = passwordInput.value

  if (!password) {
    passwordError.classList.add('visible')
    passwordInput.classList.add('error')
    isValid = false
  }

  return isValid
}

/**
 * Verifica si un string tiene formato de email válido.
 * Usa una expresión regular simple.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  // Regex básica para validar email: algo@algo.algo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
