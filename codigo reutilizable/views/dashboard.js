// ============================================================
// src/views/dashboard.js
// Vista del dashboard. Muestra estadísticas según el rol:
// - Manager: total proyectos, activos, finalizados, pendientes
// - Collaborator: sus proyectos asignados y sus estados
// ============================================================

import { getAllProjects } from '../api/projects.js'
import { getSession }     from '../services/session.js'
import { navigate }       from '../src/router.js'
import { showLoader }     from '../components/loader.js'
import { toastError }     from '../components/toast.js'

/**
 * Renderiza el dashboard en el área de contenido.
 * @param {HTMLElement} container - El div donde se inyecta la vista
 */
export async function renderDashboard(container) {
  // Mostramos un loader mientras cargamos los datos
  showLoader(container, 'Cargando dashboard...')

  // Obtenemos el usuario actual de la sesión
  const user = getSession()

  try {
    // Obtenemos todos los proyectos de la API
    const projects = await getAllProjects()

    // Dependiendo del rol, mostramos un dashboard diferente
    if (user.role === 'manager') {
      renderManagerDashboard(container, projects, user)
    } else {
      renderCollaboratorDashboard(container, projects, user)
    }

  } catch (error) {
    // Si falló la carga, mostramos un mensaje de error
    toastError('Error al cargar el dashboard')
    container.innerHTML = `
      <div class="error-page">
        <div class="error-code">500</div>
        <h2>Error al cargar datos</h2>
        <p>${error.message}</p>
        <button class="btn-primary mt-2" onclick="window.location.reload()">
          Reintentar
        </button>
      </div>
    `
  }
}

/**
 * Renderiza el dashboard para el rol MANAGER.
 * Muestra estadísticas globales de todos los proyectos.
 * @param {HTMLElement} container
 * @param {Array} projects - Todos los proyectos
 * @param {Object} user    - Usuario actual
 */
function renderManagerDashboard(container, projects, user) {
  // Calculamos las estadísticas usando los métodos de Array
  const total     = projects.length
  const active    = projects.filter(p => p.status === 'In Progress').length
  const completed = projects.filter(p => p.status === 'Completed').length
  const pending   = projects.filter(p => p.status === 'Pending').length

  // Últimos 5 proyectos creados (para la tabla de resumen)
  // sort() ordena por fecha, slice() toma los últimos 5
  const recent = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  container.innerHTML = `
    <!-- Saludo personalizado -->
    <div class="mb-2">
      <h2 class="page-title">Buenos días, ${user.name.split(' ')[0]} 👋</h2>
      <p class="page-subtitle">Aquí tienes un resumen de todos los proyectos</p>
    </div>

    <!-- Grid de estadísticas -->
    <div class="stats-grid">
      <!-- Stat 1: Total de proyectos -->
      <div class="stat-card">
        <div class="stat-icon blue">📁</div>
        <div class="stat-info">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total de proyectos</div>
        </div>
      </div>

      <!-- Stat 2: Proyectos activos (In Progress) -->
      <div class="stat-card">
        <div class="stat-icon yellow">⚡</div>
        <div class="stat-info">
          <div class="stat-value">${active}</div>
          <div class="stat-label">En progreso</div>
        </div>
      </div>

      <!-- Stat 3: Proyectos completados -->
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <div class="stat-value">${completed}</div>
          <div class="stat-label">Completados</div>
        </div>
      </div>

      <!-- Stat 4: Proyectos pendientes -->
      <div class="stat-card">
        <div class="stat-icon red">⏳</div>
        <div class="stat-info">
          <div class="stat-value">${pending}</div>
          <div class="stat-label">Pendientes</div>
        </div>
      </div>
    </div>

    <!-- Tabla de proyectos recientes -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📋 Proyectos recientes</h3>
        <!-- Botón para ir a la lista completa -->
        <button class="btn-secondary" id="btn-all-projects">
          Ver todos →
        </button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Fecha de creación</th>
              </tr>
            </thead>
            <tbody>
              ${recent.map(p => `
                <tr>
                  <td>
                    <span class="project-name-link" data-id="${p.id}">
                      ${p.name}
                    </span>
                  </td>
                  <td>${statusBadge(p.status)}</td>
                  <td style="color:var(--text-muted); font-size:0.82rem;">
                    ${formatDate(p.createdAt)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `

  // ── Eventos del dashboard ─────────────────────────────────
  // Botón "Ver todos" → navega a la lista completa
  document.getElementById('btn-all-projects')
    ?.addEventListener('click', () => navigate('#/projects'))

  // Click en nombre del proyecto → va al detalle
  document.querySelectorAll('.project-name-link').forEach(link => {
    link.addEventListener('click', () => {
      navigate(`#/projects/${link.dataset.id}`)
    })
  })
}

/**
 * Renderiza el dashboard para el rol COLLABORATOR.
 * Muestra solo los proyectos asignados a ese usuario.
 * @param {HTMLElement} container
 * @param {Array} projects - Todos los proyectos (los filtramos aquí)
 * @param {Object} user    - Usuario actual
 */
function renderCollaboratorDashboard(container, projects, user) {
  // Filtramos solo los proyectos asignados al collaborator actual
  const myProjects = projects.filter(p => p.assignedTo === user.id)

  // Calculamos stats de sus proyectos
  const total     = myProjects.length
  const active    = myProjects.filter(p => p.status === 'In Progress').length
  const completed = myProjects.filter(p => p.status === 'Completed').length

  container.innerHTML = `
    <!-- Saludo personalizado -->
    <div class="mb-2">
      <h2 class="page-title">Hola, ${user.name.split(' ')[0]} 👋</h2>
      <p class="page-subtitle">Aquí están tus proyectos asignados</p>
    </div>

    <!-- Stats del collaborator -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">📁</div>
        <div class="stat-info">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Proyectos asignados</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">⚡</div>
        <div class="stat-info">
          <div class="stat-value">${active}</div>
          <div class="stat-label">En progreso</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <div class="stat-value">${completed}</div>
          <div class="stat-label">Completados</div>
        </div>
      </div>
    </div>

    <!-- Tarjetas de sus proyectos -->
    <h3 style="font-family:var(--font-display); font-weight:700;
               margin-bottom:1rem; font-size:1rem;">
      Mis proyectos
    </h3>

    ${myProjects.length === 0
      ? `<div class="card">
           <div class="card-body">
             <div class="empty-state">
               <div class="empty-icon">📭</div>
               <h3>Sin proyectos asignados</h3>
               <p>Aún no tienes proyectos asignados</p>
             </div>
           </div>
         </div>`
      : `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:1rem;">
           ${myProjects.map(p => `
             <div class="card" style="cursor:pointer" data-id="${p.id}">
               <div class="card-body">
                 <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                   <h4 style="font-weight:600; font-size:0.95rem;">${p.name}</h4>
                   ${statusBadge(p.status)}
                 </div>
                 <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">
                   ${p.description}
                 </p>
                 <div style="font-size:0.75rem; color:var(--text-muted);">
                   📅 ${formatDate(p.createdAt)}
                 </div>
               </div>
             </div>
           `).join('')}
         </div>`
    }
  `

  // Click en una card de proyecto → va al detalle
  document.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`#/projects/${card.dataset.id}`)
    })
  })
}

/**
 * Genera el HTML de un badge de estado.
 * @param {string} status - El estado del proyecto
 * @returns {string} HTML del badge
 */
export function statusBadge(status) {
  // Mapeamos el status a la clase CSS y etiqueta correspondiente
  const map = {
    'Pending':     { cls: 'badge-pending',   label: 'Pendiente' },
    'In Progress': { cls: 'badge-progress',  label: 'En progreso' },
    'Completed':   { cls: 'badge-completed', label: 'Completado' },
    'Cancelled':   { cls: 'badge-cancelled', label: 'Cancelado' }
  }

  const { cls, label } = map[status] || { cls: '', label: status }
  return `<span class="badge ${cls}">${label}</span>`
}

/**
 * Formatea una fecha YYYY-MM-DD a un formato legible.
 * @param {string} dateStr - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha'
  const date = new Date(dateStr + 'T00:00:00') // Evitamos problemas de zona horaria
  return date.toLocaleDateString('es-CO', {
    year:  'numeric',
    month: 'long',
    day:   'numeric'
  })
}
