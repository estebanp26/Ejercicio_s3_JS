// ============================================================
// src/views/projects.js
// Vista de lista de proyectos. Incluye:
// - Tabla/lista de proyectos según rol
// - Búsqueda en tiempo real
// - Filtros por estado
// - Paginación
// - Botones de crear, editar y eliminar (según permisos)
// ============================================================

import { getAllProjects, deleteProject, getAllUsers } from '../api/projects.js'
import { getSession }   from '../services/session.js'
import { canCreate, canDelete, canEdit, filterByPermission } from '../utils/permissions.js'
import { navigate }     from '../src/router.js'
import { showLoader, emptyStateHTML } from '../components/loader.js'
import { toastSuccess, toastError }   from '../components/toast.js'
import { statusBadge, formatDate }    from './dashboard.js'

// Número de proyectos por página (para la paginación)
const PAGE_SIZE = 6

// Estado local de la vista (persiste mientras la vista está activa)
let state = {
  projects: [],         // Todos los proyectos visibles para el usuario
  users:    [],         // Lista de usuarios para resolver nombres
  filtered: [],         // Proyectos después de aplicar búsqueda y filtros
  page:     1,          // Página actual
  search:   '',         // Término de búsqueda actual
  filter:   'all'       // Filtro de estado actual
}

/**
 * Renderiza la vista de lista de proyectos.
 * @param {HTMLElement} container - El div donde se inyecta la vista
 */
export async function renderProjects(container) {
  // Mostramos loader mientras cargamos
  showLoader(container, 'Cargando proyectos...')

  try {
    // Cargamos proyectos y usuarios en paralelo para mayor velocidad
    // Promise.all espera a que AMBAS promesas terminen
    const [allProjects, allUsers] = await Promise.all([
      getAllProjects(),
      getAllUsers()
    ])

    // Guardamos los usuarios para resolver nombres luego
    state.users = allUsers

    // Filtramos proyectos según permisos del usuario actual
    state.projects = filterByPermission(allProjects)

    // Reseteamos el estado de la búsqueda y paginación
    state.search = ''
    state.filter = 'all'
    state.page   = 1

    // Aplicamos los filtros (sin ninguno activo al inicio)
    applyFilters()

    // Renderizamos el HTML de la vista
    renderView(container)

  } catch (error) {
    toastError('Error al cargar los proyectos')
    container.innerHTML = `
      <div class="error-page">
        <div class="error-code">500</div>
        <h2>Error de conexión</h2>
        <p>${error.message}</p>
        <button class="btn-primary mt-2" onclick="window.location.reload()">
          Reintentar
        </button>
      </div>
    `
  }
}

/**
 * Aplica los filtros de búsqueda y estado al array de proyectos.
 * Actualiza state.filtered con los resultados.
 */
function applyFilters() {
  let result = [...state.projects] // Copia del array original

  // ── Filtro por texto de búsqueda ───────────────────────────
  if (state.search) {
    const term = state.search.toLowerCase() // Convertimos a minúsculas para buscar

    result = result.filter(p =>
      p.name.toLowerCase().includes(term) ||         // Busca en el nombre
      p.description.toLowerCase().includes(term)     // Busca en la descripción
    )
  }

  // ── Filtro por estado ──────────────────────────────────────
  if (state.filter !== 'all') {
    result = result.filter(p => p.status === state.filter)
  }

  // Guardamos el resultado filtrado
  state.filtered = result

  // Volvemos a la página 1 cada vez que cambia el filtro
  state.page = 1
}

/**
 * Renderiza el HTML completo de la vista.
 * @param {HTMLElement} container
 */
function renderView(container) {
  const user = getSession()

  container.innerHTML = `
    <!-- Cabecera de la página -->
    <div class="page-header">
      <div>
        <h2 class="page-title">📁 Proyectos</h2>
        <p class="page-subtitle">
          ${user.role === 'manager'
            ? `${state.projects.length} proyectos en total`
            : `${state.projects.length} proyectos asignados a ti`}
        </p>
      </div>

      <!-- Botón "Nuevo proyecto" solo visible para managers -->
      ${canCreate() ? `
        <button class="btn-primary" id="btn-new-project">
          ➕ Nuevo proyecto
        </button>
      ` : ''}
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="toolbar">
      <!-- Campo de búsqueda -->
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          class="search-input"
          type="text"
          id="search-input"
          placeholder="Buscar por nombre o descripción..."
          value="${state.search}"
        />
      </div>

      <!-- Filtro por estado -->
      <select class="filter-select" id="filter-status">
        <option value="all"        ${state.filter === 'all'          ? 'selected' : ''}>Todos los estados</option>
        <option value="Pending"    ${state.filter === 'Pending'      ? 'selected' : ''}>Pendiente</option>
        <option value="In Progress"${state.filter === 'In Progress'  ? 'selected' : ''}>En progreso</option>
        <option value="Completed"  ${state.filter === 'Completed'    ? 'selected' : ''}>Completado</option>
        <option value="Cancelled"  ${state.filter === 'Cancelled'    ? 'selected' : ''}>Cancelado</option>
      </select>
    </div>

    <!-- Tabla de proyectos -->
    <div class="card">
      <div id="projects-table-body"></div>
    </div>
  `

  // Renderizamos la tabla dentro de #projects-table-body
  renderTable()

  // Registramos los eventos de búsqueda y filtros
  setupProjectsEvents(container)
}

/**
 * Renderiza (o re-renderiza) la tabla de proyectos y la paginación.
 * Se llama cuando cambia la búsqueda, el filtro o la página.
 */
function renderTable() {
  const tableBody = document.getElementById('projects-table-body')
  if (!tableBody) return

  // Calculamos los proyectos de la página actual
  const start       = (state.page - 1) * PAGE_SIZE // Índice inicial
  const end         = start + PAGE_SIZE             // Índice final (exclusivo)
  const paginated   = state.filtered.slice(start, end) // Slice del array
  const totalPages  = Math.ceil(state.filtered.length / PAGE_SIZE)

  // Si no hay resultados, mostramos el estado vacío
  if (paginated.length === 0) {
    tableBody.innerHTML = emptyStateHTML(
      'Sin proyectos',
      state.search || state.filter !== 'all'
        ? 'No encontramos proyectos con esos criterios'
        : 'Aún no hay proyectos creados',
      '📭'
    )
    return
  }

  // Función para resolver el nombre de un usuario por su id
  const getUserName = (id) => {
    const user = state.users.find(u => u.id === id)
    return user ? user.name : 'Sin asignar'
  }

  // Generamos el HTML de la tabla
  tableBody.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Responsable</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${paginated.map(project => {
            // Verificamos los permisos para este proyecto específico
            const userCanEdit   = canEdit(project)
            const userCanDelete = canDelete()

            return `
              <tr>
                <!-- Nombre clickable → va al detalle -->
                <td>
                  <span class="project-name-link" data-id="${project.id}">
                    ${project.name}
                  </span>
                </td>

                <!-- Descripción truncada -->
                <td style="color:var(--text-muted); font-size:0.82rem; max-width:200px;">
                  <span title="${project.description}">
                    ${project.description.length > 50
                      ? project.description.slice(0, 50) + '...'
                      : project.description}
                  </span>
                </td>

                <!-- Badge de estado -->
                <td>${statusBadge(project.status)}</td>

                <!-- Nombre del responsable -->
                <td style="font-size:0.85rem;">
                  ${getUserName(project.assignedTo)}
                </td>

                <!-- Fecha de creación -->
                <td style="color:var(--text-muted); font-size:0.78rem;">
                  ${formatDate(project.createdAt)}
                </td>

                <!-- Botones de acciones -->
                <td>
                  <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <!-- Ver detalle (todos pueden ver) -->
                    <button class="btn-secondary btn-view"
                            style="padding:0.4rem 0.75rem; font-size:0.78rem;"
                            data-id="${project.id}">
                      👁 Ver
                    </button>

                    <!-- Editar (según permisos) -->
                    ${userCanEdit ? `
                      <button class="btn-edit btn-edit-project"
                              data-id="${project.id}">
                        ✏️ Editar
                      </button>
                    ` : ''}

                    <!-- Eliminar (solo manager) -->
                    ${userCanDelete ? `
                      <button class="btn-danger btn-delete-project"
                              data-id="${project.id}"
                              data-name="${project.name}">
                        🗑 Eliminar
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    ${totalPages > 1 ? renderPagination(totalPages) : ''}

    <!-- Contador de resultados -->
    <div style="padding:0.75rem 1rem; font-size:0.78rem; color:var(--text-muted);
                border-top:1px solid var(--border); text-align:right;">
      Mostrando ${paginated.length} de ${state.filtered.length} proyectos
    </div>
  `

  // Registramos eventos de la tabla (los reconstruimos cada vez que re-renderizamos)
  setupTableEvents()
}

/**
 * Genera el HTML de la paginación.
 * @param {number} totalPages - Número total de páginas
 * @returns {string} HTML de la paginación
 */
function renderPagination(totalPages) {
  // Generamos un botón por cada página
  const buttons = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1
    return `
      <button class="page-btn ${page === state.page ? 'active' : ''}"
              data-page="${page}">
        ${page}
      </button>
    `
  }).join('')

  return `
    <div class="pagination">
      <!-- Botón anterior -->
      <button class="page-btn" data-page="${state.page - 1}"
              ${state.page === 1 ? 'disabled' : ''}>
        ‹
      </button>

      ${buttons}

      <!-- Botón siguiente -->
      <button class="page-btn" data-page="${state.page + 1}"
              ${state.page === totalPages ? 'disabled' : ''}>
        ›
      </button>
    </div>
  `
}

/**
 * Registra los eventos de búsqueda, filtros y botón de nuevo proyecto.
 * @param {HTMLElement} container
 */
function setupProjectsEvents(container) {
  // ── Búsqueda en tiempo real ────────────────────────────────
  const searchInput = document.getElementById('search-input')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value  // Actualizamos el estado de búsqueda
      applyFilters()                 // Re-aplicamos los filtros
      renderTable()                  // Re-renderizamos la tabla
    })
  }

  // ── Filtro por estado ──────────────────────────────────────
  const filterSelect = document.getElementById('filter-status')
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      state.filter = e.target.value  // Actualizamos el filtro activo
      applyFilters()
      renderTable()
    })
  }

  // ── Botón nuevo proyecto ───────────────────────────────────
  const btnNew = document.getElementById('btn-new-project')
  if (btnNew) {
    btnNew.addEventListener('click', () => navigate('#/projects/new'))
  }
}

/**
 * Registra los eventos de los botones dentro de la tabla.
 * Se llama cada vez que se re-renderiza la tabla.
 */
function setupTableEvents() {
  // ── Ver detalle del proyecto ───────────────────────────────
  document.querySelectorAll('.project-name-link, .btn-view').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(`#/projects/${btn.dataset.id}`)
    })
  })

  // ── Editar proyecto ─────────────────────────────────────────
  document.querySelectorAll('.btn-edit-project').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(`#/projects/${btn.dataset.id}/edit`)
    })
  })

  // ── Eliminar proyecto ──────────────────────────────────────
  document.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id   = btn.dataset.id
      const name = btn.dataset.name

      // Pedimos confirmación antes de eliminar
      const confirmed = confirm(`¿Estás seguro de eliminar el proyecto "${name}"? Esta acción no se puede deshacer.`)
      if (!confirmed) return

      try {
        // Llamamos a la API para eliminar
        await deleteProject(Number(id))
        toastSuccess(`Proyecto "${name}" eliminado correctamente`)

        // Eliminamos el proyecto del estado local para evitar recargar la API
        state.projects = state.projects.filter(p => p.id !== Number(id))
        applyFilters()
        renderTable() // Re-renderizamos sin el proyecto eliminado

      } catch (error) {
        toastError(`Error al eliminar: ${error.message}`)
      }
    })
  })

  // ── Paginación ─────────────────────────────────────────────
  document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = Number(btn.dataset.page)

      // Validamos que la página sea válida (el disabled en el HTML no es 100% confiable)
      if (isNaN(page) || page < 1) return

      const totalPages = Math.ceil(state.filtered.length / PAGE_SIZE)
      if (page > totalPages) return

      state.page = page   // Actualizamos la página actual
      renderTable()       // Re-renderizamos con la nueva página

      // Scroll al inicio de la tabla suavemente
      document.querySelector('.card')?.scrollIntoView({ behavior: 'smooth' })
    })
  })
}
