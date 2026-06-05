// ============================================================
// src/components/toast.js
// Sistema de notificaciones tipo "toast" (pop-ups temporales).
// Los toasts aparecen en la esquina inferior derecha y
// desaparecen automáticamente después de unos segundos.
// ============================================================

// Referencia al contenedor de toasts en el DOM
// Lo creamos solo una vez cuando se llama por primera vez
let toastContainer = null

/**
 * Inicializa el contenedor de toasts en el DOM.
 * Se llama automáticamente cuando se muestra el primer toast.
 */
function initContainer() {
  // Si ya existe, no lo creamos de nuevo
  if (toastContainer) return

  // Creamos el div contenedor
  toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container'

  // Lo añadimos al body (fuera del flujo normal de la página)
  document.body.appendChild(toastContainer)
}

/**
 * Muestra una notificación toast.
 * @param {string} message  - Texto del mensaje
 * @param {'success'|'error'|'info'|'warning'} type - Tipo de toast
 * @param {number} duration - Duración en milisegundos (default 3500ms)
 */
export function showToast(message, type = 'info', duration = 3500) {
  // Aseguramos que el contenedor existe
  initContainer()

  // Ícono según el tipo de toast
  const icons = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    warning: '⚠️'
  }

  // Creamos el elemento del toast
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}` // Clases para estilos y color del borde

  // HTML interno del toast
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `

  // Añadimos el toast al contenedor
  toastContainer.appendChild(toast)

  // Función para remover el toast con animación
  const remove = () => {
    toast.classList.add('removing') // Agrega clase que activa la animación de salida

    // Eliminamos el elemento del DOM después de que termina la animación (300ms)
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }

  // El toast se elimina automáticamente después de `duration` ms
  setTimeout(remove, duration)
}

// Funciones de conveniencia para cada tipo de toast
// Evitan tener que pasar el tipo cada vez

/**
 * Muestra un toast de éxito (verde).
 * @param {string} message
 */
export const toastSuccess = (message) => showToast(message, 'success')

/**
 * Muestra un toast de error (rojo).
 * @param {string} message
 */
export const toastError = (message) => showToast(message, 'error')

/**
 * Muestra un toast de información (azul).
 * @param {string} message
 */
export const toastInfo = (message) => showToast(message, 'info')

/**
 * Muestra un toast de advertencia (amarillo).
 * @param {string} message
 */
export const toastWarning = (message) => showToast(message, 'warning')
