// ============================================================
// src/components/loader.js
// Componente de loading reutilizable.
// Muestra un spinner mientras se cargan datos de la API.
// ============================================================

/**
 * Retorna el HTML de un spinner de carga.
 * @param {string} message - Mensaje opcional a mostrar bajo el spinner
 * @returns {string} HTML del loader
 */
export function loaderHTML(message = 'Cargando...') {
  return `
    <div class="flex-center" style="padding: 3rem; flex-direction: column; gap: 1rem;">
      <div class="spinner"></div>
      <p style="color: var(--text-muted); font-size: 0.875rem;">${message}</p>
    </div>
  `
}

/**
 * Muestra un loader en un elemento del DOM.
 * @param {HTMLElement} container - El elemento donde mostrar el loader
 * @param {string} message        - Mensaje opcional
 */
export function showLoader(container, message) {
  container.innerHTML = loaderHTML(message)
}

/**
 * Retorna el HTML de un estado vacío (sin datos).
 * @param {string} title   - Título del estado vacío
 * @param {string} message - Mensaje descriptivo
 * @param {string} icon    - Emoji/ícono a mostrar
 * @returns {string} HTML del estado vacío
 */
export function emptyStateHTML(title, message, icon = '📭') {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `
}
