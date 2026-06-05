// ============================================================
// src/utils/permissions.js
// Define qué puede hacer cada rol en la aplicación.
// Centralizar los permisos aquí evita repetir lógica en
// múltiples vistas y facilita el mantenimiento.
// ============================================================

import { getSession } from '../services/session.js'

/**
 * Verifica si el usuario actual puede CREAR proyectos.
 * Solo el manager puede crear proyectos.
 * @returns {boolean}
 */
export function canCreate() {
  const user = getSession()
  return user?.role === 'manager'
}

/**
 * Verifica si el usuario actual puede ELIMINAR proyectos.
 * Solo el manager puede eliminar proyectos.
 * @returns {boolean}
 */
export function canDelete() {
  const user = getSession()
  return user?.role === 'manager'
}

/**
 * Verifica si el usuario actual puede EDITAR un proyecto específico.
 * - El manager puede editar cualquier proyecto.
 * - El collaborator SOLO puede actualizar el estado de SUS proyectos.
 * @param {Object} project - El proyecto que se quiere editar
 * @returns {boolean}
 */
export function canEdit(project) {
  const user = getSession()
  if (!user) return false

  // El manager puede editar todo
  if (user.role === 'manager') return true

  // El collaborator solo puede editar el estado si el proyecto le pertenece
  if (user.role === 'collaborator') {
    return project.assignedTo === user.id
  }

  // Cualquier otro rol: sin permiso
  return false
}

/**
 * Verifica si el usuario puede VER un proyecto específico.
 * - El manager ve todos.
 * - El collaborator solo ve los asignados a él.
 * @param {Object} project - El proyecto a verificar
 * @returns {boolean}
 */
export function canView(project) {
  const user = getSession()
  if (!user) return false
  if (user.role === 'manager') return true
  return project.assignedTo === user.id
}

/**
 * Filtra un array de proyectos según lo que puede ver el usuario actual.
 * @param {Array} projects - Lista completa de proyectos
 * @returns {Array} Proyectos visibles para el usuario actual
 */
export function filterByPermission(projects) {
  const user = getSession()
  if (!user) return []
  if (user.role === 'manager') return projects

  // El collaborator solo ve sus proyectos asignados
  return projects.filter(p => p.assignedTo === user.id)
}
