// ============================================================
// src/services/session.js
// Maneja la persistencia de sesión del usuario usando localStorage.
// localStorage persiste aunque se cierre el navegador.
// Todas las funciones son puras (sin efectos secundarios).
// ============================================================

// Clave que usaremos en localStorage para guardar la sesión
const SESSION_KEY = 'pm_session'

/**
 * Guarda el objeto del usuario en localStorage.
 * Se llama después de un login exitoso.
 * @param {Object} user - Objeto del usuario { id, name, email, role }
 */
export function saveSession(user) {
  // JSON.stringify convierte el objeto a string para poder guardarlo
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

/**
 * Lee y retorna el objeto de sesión guardado.
 * Se llama al arrancar la app para saber si ya hay sesión.
 * @returns {Object|null} El usuario guardado, o null si no hay sesión
 */
export function getSession() {
  // Obtenemos el string guardado
  const raw = localStorage.getItem(SESSION_KEY)

  // Si no hay nada guardado, retornamos null
  if (!raw) return null

  try {
    // JSON.parse convierte el string de vuelta a objeto
    return JSON.parse(raw)
  } catch {
    // Si el JSON está corrupto, limpiamos y retornamos null
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

/**
 * Elimina la sesión del localStorage.
 * Se llama cuando el usuario hace logout.
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Verifica rápidamente si hay una sesión activa.
 * @returns {boolean} true si hay sesión, false si no
 */
export function isLoggedIn() {
  return getSession() !== null
}

/**
 * Verifica si el usuario actual tiene rol de manager.
 * @returns {boolean} true si es manager
 */
export function isManager() {
  const user = getSession()
  // Usamos optional chaining (?.) por si user es null
  return user?.role === 'manager'
}

/**
 * Verifica si el usuario actual tiene rol de collaborator.
 * @returns {boolean} true si es collaborator
 */
export function isCollaborator() {
  const user = getSession()
  return user?.role === 'collaborator'
}
