// ============================================================
// src/components/navbar.js
// Sidebar de navegación de la aplicación.
// Se renderiza una vez que el usuario está autenticado.
// Incluye: logo, links de navegación según rol, info del usuario
// y botones de logout y toggle de dark mode.
// ============================================================

import { getSession, clearSession } from '../services/session.js'
import { navigate }                 from '../src/router.js'

/**
 * Retorna el HTML del sidebar completo.
 * @param {string} currentRoute - La ruta activa actual (ej: '#/dashboard')
 * @returns {string} HTML del sidebar
 */
export function sidebarHTML(currentRoute = '') {
  // Obtenemos los datos del usuario de la sesión
  const user = getSession()

  // Si no hay usuario, retornamos string vacío (no debería pasar)
  if (!user) return ''

  // Creamos la inicial del nombre para el avatar
  const initials = user.name
    .split(' ')                   // Dividimos el nombre en palabras
    .map(w => w[0])               // Tomamos la primera letra de cada palabra
    .slice(0, 2)                  // Máximo 2 letras
    .join('')                     // Unimos las letras
    .toUpperCase()                // Las ponemos en mayúsculas

  // Función auxiliar: retorna 'active' si la ruta coincide con la actual
  const isActive = (route) => currentRoute === route ? 'active' : ''

  // Links que ven AMBOS roles
  const commonLinks = `
    <a class="nav-link ${isActive('#/dashboard')}" data-route="#/dashboard">
      <span class="nav-icon">📊</span>
      Dashboard
    </a>
    <a class="nav-link ${isActive('#/projects')}" data-route="#/projects">
      <span class="nav-icon">📁</span>
      Proyectos
    </a>
  `

  // Links que solo ve el MANAGER
  const managerLinks = user.role === 'manager' ? `
    <p class="nav-section-title">Administración</p>
    <a class="nav-link ${isActive('#/projects/new')}" data-route="#/projects/new">
      <span class="nav-icon">➕</span>
      Nuevo Proyecto
    </a>
  ` : ''

  return `
    <aside class="sidebar" id="sidebar">
      <!-- Logo y nombre de la app -->
      <div class="sidebar-brand">
        <div class="brand-icon">🚀</div>
        <h1>Project<span>Hub</span></h1>
      </div>

      <!-- Navegación principal -->
      <nav class="sidebar-nav">
        <p class="nav-section-title">Principal</p>
        ${commonLinks}
        ${managerLinks}
      </nav>

      <!-- Sección del usuario en el fondo del sidebar -->
      <div class="sidebar-user">
        <div class="user-info">
          <!-- Avatar con las iniciales del usuario -->
          <div class="user-avatar">${initials}</div>
          <div class="user-details">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role}</div>
          </div>
        </div>

        <!-- Botón de dark mode -->
        <button class="nav-link" id="btn-theme" title="Cambiar tema">
          <span class="nav-icon" id="theme-icon">🌙</span>
          Cambiar tema
        </button>

        <!-- Botón de logout -->
        <button class="btn-logout" id="btn-logout">
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  `
}

/**
 * Genera el HTML de la barra superior (topbar).
 * @param {string} title - Título de la página actual
 * @returns {string} HTML del topbar
 */
export function topbarHTML(title = 'Dashboard') {
  return `
    <header class="topbar">
      <!-- Botón hamburguesa solo visible en móvil -->
      <button class="hamburger btn-secondary" id="btn-menu" title="Menú" style="display:none">
        ☰
      </button>

      <h2 class="topbar-title">${title}</h2>

      <div class="topbar-actions">
        <!-- Fecha actual -->
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          ${new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>
    </header>
  `
}

/**
 * Registra todos los event listeners del sidebar.
 * Se llama después de que el sidebar se inserta en el DOM.
 */
export function setupNavbarEvents() {
  // ── Navegación por los links del sidebar ───────────────────
  // Usamos querySelectorAll para obtener todos los links de navegación
  const navLinks = document.querySelectorAll('.nav-link[data-route]')

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()                        // Evita el comportamiento por defecto del <a>
      const route = link.dataset.route          // Leemos el atributo data-route
      navigate(route)                           // Navegamos a esa ruta
    })
  })

  // ── Botón de logout ─────────────────────────────────────────
  const btnLogout = document.getElementById('btn-logout')
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      clearSession()                            // Borramos la sesión del localStorage
      navigate('#/login')                       // Redirigimos al login
    })
  }

  // ── Toggle de Dark Mode ────────────────────────────────────
  const btnTheme = document.getElementById('btn-theme')
  if (btnTheme) {
    // Verificamos si el dark mode ya estaba activado (persistido en localStorage)
    const isDark = localStorage.getItem('pm_theme') === 'dark'
    if (isDark) {
      document.documentElement.classList.add('dark')  // Añadimos la clase al <html>
      updateThemeIcon(true)
    }

    btnTheme.addEventListener('click', () => {
      // Alternamos la clase 'dark' en el elemento <html>
      const darkNow = document.documentElement.classList.toggle('dark')

      // Guardamos la preferencia en localStorage
      localStorage.setItem('pm_theme', darkNow ? 'dark' : 'light')

      // Actualizamos el ícono del botón
      updateThemeIcon(darkNow)
    })
  }

  // ── Botón hamburguesa (móvil) ──────────────────────────────
  const btnMenu = document.getElementById('btn-menu')
  const sidebar = document.getElementById('sidebar')

  if (btnMenu && sidebar) {
    // Mostramos el botón hamburguesa en mobile
    if (window.innerWidth <= 768) {
      btnMenu.style.display = 'flex'
    }

    btnMenu.addEventListener('click', () => {
      // Alternamos la clase 'open' para mostrar/ocultar el sidebar en mobile
      sidebar.classList.toggle('open')
    })

    // Cerramos el sidebar si se hace click fuera de él (en el overlay)
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          e.target !== btnMenu) {
        sidebar.classList.remove('open')
      }
    })
  }
}

/**
 * Actualiza el ícono del botón de dark mode.
 * @param {boolean} isDark - true si el dark mode está activado
 */
function updateThemeIcon(isDark) {
  const icon = document.getElementById('theme-icon')
  if (icon) {
    // Sol para modo claro, luna para modo oscuro
    icon.textContent = isDark ? '☀️' : '🌙'
  }
}

/**
 * Actualiza el link activo en el sidebar sin re-renderizarlo.
 * Se llama cada vez que cambia la ruta.
 * @param {string} route - La nueva ruta activa
 */
export function updateActiveNavLink(route) {
  // Quitamos la clase 'active' de todos los links
  document.querySelectorAll('.nav-link[data-route]').forEach(link => {
    link.classList.remove('active')

    // Si el data-route del link coincide con la ruta actual, lo marcamos como activo
    if (link.dataset.route === route) {
      link.classList.add('active')
    }
  })
}
