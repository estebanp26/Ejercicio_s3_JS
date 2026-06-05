// ============================================================
// src/views/projectForm.js
// Formulario para CREAR y EDITAR proyectos.
// Si recibe un `id`, está en modo edición.
// Si no recibe `id`, está en modo creación.
// El collaborator solo puede editar el estado de sus proyectos.
// ============================================================

import { getProjectById, createProject, updateProject, getAllUsers } from '../api/projects.js'
import { getSession }   from '../services/session.js'
import { canCreate, canEdit } from '../utils/permissions.js'
import { navigate }   from '../src/router.js'

import { showLoader }   from '../components/loader.js'
import { toastSuccess, toastError } from '../components/toast.js'

/**
 * Renderiza el formulario de proyecto (crear o editar).
 * @param {HTMLElement} container - El div donde se inyecta la vista
 * @param {string|null} id        - ID del proyecto a editar, o null para crear
 */
export async function renderProjectForm(container, id = null) {
  // Determinamos si estamos en modo edición
  const isEditMode = id !== null

  // Mostramos un loader mientras cargamos los datos
  showLoader(container, isEditMode ? 'Cargando proyecto...' : 'Preparando formulario...')

  const user = getSession()

  try {
    // Variables que se llenarán según el modo
    let project   = null  // El proyecto a editar (solo en modo edición)
    let users     = []    // Lista de usuarios para el select de responsable

    // ── Modo EDICIÓN: cargamos el proyecto existente ─────────
    if (isEditMode) {
      // Cargamos el proyecto y los usuarios en paralelo
      ;[project, users] = await Promise.all([
        getProjectById(Number(id)),
        getAllUsers()
      ])

      // Verificamos que el usuario tenga permiso para editar este proyecto
      if (!canEdit(project)) {
        container.innerHTML = `
          <div class="error-page">
            <div class="error-code">403</div>
            <h2>Acceso denegado</h2>
            <p>No tienes permiso para editar este proyecto</p>
            <button class="btn-primary mt-2" id="btn-back">← Volver</button>
          </div>
        `
        document.getElementById('btn-back')?.addEventListener('click', () => navigate('#/projects'))
        return
      }

    // ── Modo CREACIÓN: verificamos permiso de creación ───────
    } else {
      if (!canCreate()) {
        container.innerHTML = `
          <div class="error-page">
            <div class="error-code">403</div>
            <h2>Acceso denegado</h2>
            <p>Solo los managers pueden crear proyectos</p>
            <button class="btn-primary mt-2" id="btn-back">← Volver</button>
          </div>
        `
        document.getElementById('btn-back')?.addEventListener('click', () => navigate('#/projects'))
        return
      }

      // Solo cargamos los usuarios en modo creación
      users = await getAllUsers()
    }

    // El collaborator solo puede editar el estado — campos limitados
    const isCollaborator   = user.role === 'collaborator'

    // ── Generamos las opciones del select de responsable ─────
    const userOptions = users
      .filter(u => u.role === 'collaborator') // Solo collaborators pueden ser asignados
      .map(u => `
        <option value="${u.id}"
                ${project?.assignedTo === u.id ? 'selected' : ''}>
          ${u.name}
        </option>
      `).join('')

    // ── Renderizamos el formulario ────────────────────────────
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">
            ${isEditMode ? '✏️ Editar proyecto' : '➕ Nuevo proyecto'}
          </h2>
          <p class="page-subtitle">
            ${isEditMode
              ? isCollaborator
                ? 'Puedes actualizar el estado de este proyecto'
                : 'Modifica los datos del proyecto'
              : 'Completa los datos para crear un nuevo proyecto'}
          </p>
        </div>
        <!-- Botón de volver -->
        <button class="btn-secondary" id="btn-back">← Volver</button>
      </div>

      <!-- Card del formulario -->
      <div class="card" style="max-width: 600px;">
        <div class="card-body">

          <!-- Nombre del proyecto -->
          <div class="form-group">
            <label class="form-label" for="field-name">
              Nombre del proyecto *
            </label>
            <input
              class="form-input"
              type="text"
              id="field-name"
              placeholder="Ej: Rediseño del sitio web"
              value="${project?.name || ''}"
              ${isCollaborator ? 'disabled' : ''}
            />
            <span class="field-error" id="error-name">
              El nombre es requerido
            </span>
          </div>

          <!-- Descripción -->
          <div class="form-group">
            <label class="form-label" for="field-description">
              Descripción *
            </label>
            <textarea
              class="form-textarea"
              id="field-description"
              placeholder="Describe el objetivo del proyecto..."
              ${isCollaborator ? 'disabled' : ''}
            >${project?.description || ''}</textarea>
            <span class="field-error" id="error-description">
              La descripción es requerida
            </span>
          </div>

          <!-- Estado -->
          <div class="form-group">
            <label class="form-label" for="field-status">Estado *</label>
            <select class="form-select" id="field-status">
              <option value="Pending"
                ${project?.status === 'Pending' || !project ? 'selected' : ''}>
                ⏳ Pendiente
              </option>
              <option value="In Progress"
                ${project?.status === 'In Progress' ? 'selected' : ''}>
                ⚡ En progreso
              </option>
              <option value="Completed"
                ${project?.status === 'Completed' ? 'selected' : ''}>
                ✅ Completado
              </option>
              <option value="Cancelled"
                ${project?.status === 'Cancelled' ? 'selected' : ''}>
                ❌ Cancelado
              </option>
            </select>
          </div>

          <!-- Responsable (solo manager puede asignar) -->
          ${!isCollaborator ? `
            <div class="form-group">
              <label class="form-label" for="field-assigned">
                Responsable *
              </label>
              <select class="form-select" id="field-assigned">
                <option value="">— Seleccionar responsable —</option>
                ${userOptions}
              </select>
              <span class="field-error" id="error-assigned">
                Debes seleccionar un responsable
              </span>
            </div>
          ` : ''}

          <!-- Botones de acción -->
          <div style="display:flex; gap:1rem; margin-top:1.5rem;">
            <button class="btn-primary" id="btn-submit">
              ${isEditMode ? '💾 Guardar cambios' : '🚀 Crear proyecto'}
            </button>
            <button class="btn-secondary" id="btn-cancel">
              Cancelar
            </button>
          </div>

        </div>
      </div>
    `

    // Registramos los eventos del formulario
    setupFormEvents(isEditMode, isCollaborator, project, Number(id))

  } catch (error) {
    toastError('Error al cargar el formulario')
    container.innerHTML = `
      <div class="error-page">
        <div class="error-code">500</div>
        <h2>${error.message}</h2>
        <button class="btn-primary mt-2" id="btn-back">← Volver</button>
      </div>
    `
    document.getElementById('btn-back')?.addEventListener('click', () => navigate('#/projects'))
  }
}

/**
 * Configura los event listeners del formulario.
 * @param {boolean} isEditMode       - Si estamos editando
 * @param {boolean} isCollaborator   - Si el usuario es collaborator
 * @param {Object|null} project      - El proyecto original (en edición)
 * @param {number} projectId         - ID del proyecto a editar
 */
function setupFormEvents(isEditMode, isCollaborator, project, projectId) {
  // ── Botón de volver y cancelar ─────────────────────────────
  document.getElementById('btn-back')
    ?.addEventListener('click', () => navigate('#/projects'))

  document.getElementById('btn-cancel')
    ?.addEventListener('click', () => navigate('#/projects'))

  // ── Botón de guardar/crear ─────────────────────────────────
  document.getElementById('btn-submit')?.addEventListener('click', async () => {
    // Validamos el formulario
    if (!validateProjectForm(isCollaborator)) return

    const btnSubmit = document.getElementById('btn-submit')
    btnSubmit.disabled    = true
    btnSubmit.textContent = isEditMode ? 'Guardando...' : 'Creando...'

    try {
      if (isEditMode) {
        // ── Actualización ──────────────────────────────────────
        let updates = {}

        if (isCollaborator) {
          // El collaborator solo puede cambiar el estado
          updates.status = document.getElementById('field-status').value

        } else {
          // El manager puede cambiar todo
          updates = {
            name:        document.getElementById('field-name').value.trim(),
            description: document.getElementById('field-description').value.trim(),
            status:      document.getElementById('field-status').value,
            assignedTo:  Number(document.getElementById('field-assigned').value)
          }
        }

        // Llamamos a PATCH en la API
        await updateProject(projectId, updates)
        toastSuccess('Proyecto actualizado correctamente ✅')

      } else {
        // ── Creación ───────────────────────────────────────────
        const newProject = {
          name:        document.getElementById('field-name').value.trim(),
          description: document.getElementById('field-description').value.trim(),
          status:      document.getElementById('field-status').value,
          assignedTo:  Number(document.getElementById('field-assigned').value)
        }

        // Llamamos a POST en la API
        await createProject(newProject)
        toastSuccess('Proyecto creado correctamente 🚀')
      }

      // Navegamos a la lista de proyectos
      navigate('#/projects')

    } catch (error) {
      toastError(`Error: ${error.message}`)

      // Re-habilitamos el botón
      btnSubmit.disabled    = false
      btnSubmit.textContent = isEditMode ? '💾 Guardar cambios' : '🚀 Crear proyecto'
    }
  })
}

/**
 * Valida los campos del formulario.
 * @param {boolean} isCollaborator - Si el usuario es collaborator
 * @returns {boolean} true si todos los campos son válidos
 */
function validateProjectForm(isCollaborator) {
  let isValid = true

  // El collaborator solo valida el estado (que siempre tiene un valor)
  if (isCollaborator) return true

  // ── Validar nombre ─────────────────────────────────────────
  const nameInput = document.getElementById('field-name')
  const nameError = document.getElementById('error-name')

  if (!nameInput.value.trim()) {
    nameError.classList.add('visible')
    nameInput.classList.add('error')
    isValid = false
  } else {
    nameError.classList.remove('visible')
    nameInput.classList.remove('error')
  }

  // ── Validar descripción ────────────────────────────────────
  const descInput = document.getElementById('field-description')
  const descError = document.getElementById('error-description')

  if (!descInput.value.trim()) {
    descError.classList.add('visible')
    descInput.classList.add('error')
    isValid = false
  } else {
    descError.classList.remove('visible')
    descInput.classList.remove('error')
  }

  // ── Validar responsable ────────────────────────────────────
  const assignedInput = document.getElementById('field-assigned')
  const assignedError = document.getElementById('error-assigned')

  if (assignedInput && !assignedInput.value) {
    assignedError.classList.add('visible')
    assignedInput.classList.add('error')
    isValid = false
  } else if (assignedInput) {
    assignedError.classList.remove('visible')
    assignedInput.classList.remove('error')
  }

  return isValid
}
