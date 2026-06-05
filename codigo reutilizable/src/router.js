// ============================================================
// src/router.js
// Enrutador de la SPA basado en hash (#).
// Usa window.location.hash para saber en qué "página" estamos.
// Cuando el hash cambia, renderiza la vista correspondiente.
// El servidor NUNCA ve el hash — todo lo maneja JavaScript.
// ============================================================

import { isLoggedIn, isManager, getSession } from '../services/session.js'
import { sidebarHTML, topbarHTML, setupNavbarEvents, updateActiveNavLink } from '../components/navbar.js'

// Importamos las vistas
import { renderLogin }         from '../views/login.js';
import { renderDashboard }     from '../views/dashboard.js';
import { renderProjects }      from '../views/projects.js';
import { renderProjectForm }   from '../views/projectForm.js';
import { renderProjectDetail } from '../views/projectDetail.js';

/**
 * Mapa de rutas de la aplicación.
 * Cada entrada define una ruta y sus propiedades:
 * - protected: requiere autenticación
 * - managerOnly: requiere rol manager
 * - title: título que aparece en el topbar
 */
const ROUTES = {
  '#/login': {
    title:      'Iniciar sesión',
    protected:  false,
    managerOnly: false
  },
  '#/dashboard': {
    title:      'Dashboard',
    protected:  true,
    managerOnly: false
  },
  '#/projects': {
    title:      'Proyectos',
    protected:  true,
    managerOnly: false
  },
  '#/projects/new': {
    title:      'Nuevo proyecto',
    protected:  true,
    managerOnly: true   // Solo el manager puede acceder a crear
  }
}

/**
 * Función principal del router.
 * Se llama al arrancar la app y cada vez que cambia el hash.
 */
export function handleRoute() {
  // Obtenemos el hash actual de la URL
  // Si no hay hash, usamos '#/login' como valor por defecto
  let hash = window.location.hash || '#/login'

  // ── Protección de rutas ────────────────────────────────────

  // Si el usuario no está autenticado e intenta ir a una ruta privada
  if (!isLoggedIn() && hash !== '#/login') {
    navigate('#/login')   // Redirigimos al login
    return                // Paramos la ejecución
  }

  // Si el usuario está autenticado e intenta ir al login
  // Lo redirigimos al dashboard
  if (isLoggedIn() && hash === '#/login') {
    navigate('#/dashboard')
    return
  }

  // ── Rutas dinámicas (con parámetros) ──────────────────────
  // Estas rutas tienen un ID en la URL: /projects/1, /projects/1/edit

  // Ruta de edición: #/projects/:id/edit
  const editMatch = hash.match(/^#\/projects\/(\d+)\/edit$/)

  // Ruta de detalle: #/projects/:id
  const detailMatch = hash.match(/^#\/projects\/(\d+)$/)

  // ── Renderizado según la ruta ──────────────────────────────

  const app = document.getElementById('app')

  if (hash === '#/login') {
    // Vista de login: no tiene layout con sidebar
    renderLogin()
    return
  }

  // Para todas las rutas privadas, primero renderizamos el layout
  // con el sidebar y topbar, luego la vista específica dentro del contenedor
  renderAppLayout(hash)

  // Obtenemos el contenedor de la vista (se crea dentro del layout)
  const viewContainer = document.getElementById('view-container')

  // Determinamos qué vista renderizar
  if (hash === '#/dashboard') {
    renderDashboard(viewContainer)

  } else if (hash === '#/projects' && !editMatch && !detailMatch) {
    renderProjects(viewContainer)

  } else if (hash === '#/projects/new') {
    // Verificamos el permiso de manager antes de renderizar
    if (!isManager()) {
      navigate('#/projects')
      return
    }
    renderProjectForm(viewContainer, null) // null = modo creación

  } else if (editMatch) {
    // Extraemos el ID del proyecto de la URL
    const id = editMatch[1]
    renderProjectForm(viewContainer, id)   // id = modo edición

  } else if (detailMatch) {
    const id = detailMatch[1]
    renderProjectDetail(viewContainer, id)

  } else {
    // Ruta no encontrada — mostramos un 404
    viewContainer.innerHTML = `
      <div class="error-page">
        <div class="error-code">404</div>
        <h2>Página no encontrada</h2>
        <p>La ruta <code>${hash}</code> no existe</p>
        <button class="btn-primary mt-2" id="btn-home">Ir al inicio</button>
      </div>
    `
    document.getElementById('btn-home')
      ?.addEventListener('click', () => navigate('#/dashboard'))
  }

  // Actualizamos el link activo en el sidebar
  updateActiveNavLink(hash)
}

/**
 * Renderiza el layout principal de la app (sidebar + topbar + contenedor).
 * Solo se re-renderiza completo si el layout no existe aún.
 * En caso contrario, solo actualiza el título del topbar.
 * @param {string} hash - La ruta actual
 */
function renderAppLayout(hash) {
  const app = document.getElementById('app')

  // Determinamos el título según la ruta
  const routeConfig = ROUTES[hash]
  let title = 'ProjectHub'

  if (routeConfig) {
    title = routeConfig.title
  } else if (hash.includes('/edit')) {
    title = 'Editar proyecto'
  } else if (hash.match(/^#\/projects\/\d+$/)) {
    title = 'Detalle del proyecto'
  }

  // Si el layout ya existe, solo actualizamos el título del topbar
  // Esto evita re-renderizar todo el sidebar (y perder los event listeners)
  const existingLayout = document.querySelector('.app-layout')
  if (existingLayout) {
    const topbarTitle = document.querySelector('.topbar-title')
    if (topbarTitle) topbarTitle.textContent = title
    return
  }

  // Si no existe el layout, lo creamos completo
  app.innerHTML = `
    <div class="app-layout">
      <!-- Sidebar de navegación -->
      ${sidebarHTML(hash)}

      <!-- Área de contenido principal -->
      <div class="main-content">
        <!-- Topbar superior -->
        ${topbarHTML(title)}

        <!-- Aquí se inyecta cada vista -->
        <div class="view-container" id="view-container">
          <!-- El contenido de la vista va aquí -->
        </div>
      </div>
    </div>
  `

  // Registramos los eventos del sidebar (logout, dark mode, navegación)
  setupNavbarEvents()
}

/**
 * Navega a una ruta cambiando el hash de la URL.
 * Al cambiar el hash, el evento 'hashchange' se dispara
 * automáticamente y llama a handleRoute().
 * @param {string} route - La ruta a la que navegar (ej: '#/dashboard')
 */
export function navigate(route) {
  window.location.hash = route
}

/**
 * Inicializa el router.
 * Registra los listeners de eventos y maneja la ruta inicial.
 */
export function initRouter() {
  // Escucha cambios en el hash de la URL
  // hashchange se dispara cuando el usuario navega o cuando llamamos navigate()
  window.addEventListener('hashchange', handleRoute)

  // Maneja la ruta inicial al cargar la app por primera vez
  handleRoute()
}
