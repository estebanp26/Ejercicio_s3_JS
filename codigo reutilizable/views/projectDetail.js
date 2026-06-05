// ============================================================
// src/views/projectDetail.js
// Vista de detalle de un proyecto específico.
// Muestra todos los datos del proyecto.
// Permite editar o eliminar según el rol del usuario.
// ============================================================

import { getProjectById, deleteProject, getAllUsers } from '../api/projects.js'
import { canEdit, canDelete } from '../utils/permissions.js'
import { navigate }           from '../src/router.js'
import { showLoader }         from '../components/loader.js'
import { toastSuccess, toastError } from '../components/toast.js'
import { statusBadge, formatDate }  from './dashboard.js'

/**
 * Renderiza la vista de detalle de un proyecto.
 * @param {HTMLElement} container - El div donde se inyecta la vista
 * @param {string} id             - ID del proyecto a mostrar
 */
export async function renderProjectDetail(container, id) {
  // Mostramos loader mientras cargamos
  showLoader(container, 'Cargando proyecto...')

  try {
    // Cargamos el proyecto y los usuarios en paralelo
    const [project, users] = await Promise.all([
      getProjectById(Number(id)),
      getAllUsers()
    ])

    // Buscamos el nombre del responsable usando su id
    const responsible = users.find(u => u.id === project.assignedTo)
    const responsibleName = responsible ? responsible.name : 'Sin asignar'

    // Verificamos los permisos del usuario actual para este proyecto
    const userCanEdit   = canEdit(project)
    const userCanDelete = canDelete()

    container.innerHTML = `
      <!-- Botón de volver -->
      <div style="margin-bottom:1.5rem;">
        <button class="btn-secondary" id="btn-back">
          ← Volver a proyectos
        </button>
      </div>

      <!-- Cabecera del detalle -->
      <div class="detail-header">
        <div>
          <h2 class="detail-title">${project.name}</h2>
          <!-- Badge del estado actual -->
          <div style="margin-top:0.5rem;">
            ${statusBadge(project.status)}
          </div>
        </div>

        <!-- Botones de acción según permisos -->
        <div style="display:flex; gap:0.75rem;">
          ${userCanEdit ? `
            <button class="btn-edit" id="btn-edit">
              ✏️ Editar
            </button>
          ` : ''}

          ${userCanDelete ? `
            <button class="btn-danger" id="btn-delete">
              🗑 Eliminar
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Grid con los detalles del proyecto -->
      <div class="detail-grid">
        <!-- Descripción -->
        <div class="detail-item" style="grid-column: 1 / -1;">
          <div class="detail-item-label">Descripción</div>
          <div class="detail-item-value" style="line-height:1.6;">
            ${project.description}
          </div>
        </div>

        <!-- Estado -->
        <div class="detail-item">
          <div class="detail-item-label">Estado</div>
          <div class="detail-item-value">${project.status}</div>
        </div>

        <!-- Responsable -->
        <div class="detail-item">
          <div class="detail-item-label">Responsable</div>
          <div class="detail-item-value">👤 ${responsibleName}</div>
        </div>

        <!-- Fecha de creación -->
        <div class="detail-item">
          <div class="detail-item-label">Fecha de creación</div>
          <div class="detail-item-value">📅 ${formatDate(project.createdAt)}</div>
        </div>

        <!-- ID del proyecto -->
        <div class="detail-item">
          <div class="detail-item-label">ID del proyecto</div>
          <div class="detail-item-value" style="color:var(--text-muted); font-family:monospace;">
            #${project.id}
          </div>
        </div>
      </div>
    `

    // ── Registramos eventos ───────────────────────────────────

    // Botón de volver
    document.getElementById('btn-back')
      ?.addEventListener('click', () => navigate('#/projects'))

    // Botón de editar → navega al formulario en modo edición
    document.getElementById('btn-edit')
      ?.addEventListener('click', () => navigate(`#/projects/${id}/edit`))

    // Botón de eliminar
    document.getElementById('btn-delete')
      ?.addEventListener('click', async () => {
        const confirmed = confirm(
          `¿Estás seguro de eliminar "${project.name}"?\nEsta acción no se puede deshacer.`
        )
        if (!confirmed) return

        try {
          await deleteProject(Number(id))
          toastSuccess(`Proyecto "${project.name}" eliminado ✅`)
          navigate('#/projects')        // Volvemos a la lista
        } catch (error) {
          toastError(`Error al eliminar: ${error.message}`)
        }
      })

  } catch (error) {
    toastError('Error al cargar el proyecto')
    container.innerHTML = `
      <div class="error-page">
        <div class="error-code">404</div>
        <h2>Proyecto no encontrado</h2>
        <p>${error.message}</p>
        <button class="btn-primary mt-2" id="btn-back">← Volver</button>
      </div>
    `
    document.getElementById('btn-back')?.addEventListener('click', () => navigate('#/projects'))
  }
}
