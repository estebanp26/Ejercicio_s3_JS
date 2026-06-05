// ============================================================
// src/main.js
// Punto de entrada principal de la SPA.
// Es el primer archivo que ejecuta Vite.
// Su responsabilidad es arrancar la aplicación:
// 1. Aplicar el tema guardado (dark/light)
// 2. Inicializar el router
// ============================================================

// Importamos el router que gestiona toda la navegación
import { initRouter } from './router.js'


/**
 * Función de arranque de la aplicación.
 * Se ejecuta cuando el DOM está completamente cargado.
 */
function bootstrap() {

  // ── 1. Aplicar tema guardado ───────────────────────────────
  // Leemos la preferencia de tema del localStorage
  // Esto asegura que el dark mode persiste entre recargas
  const savedTheme = localStorage.getItem('pm_theme')

  if (savedTheme === 'dark') {
    // Añadimos la clase 'dark' al <html> para activar las variables de dark mode
    // Esta clase es leída por el CSS en el selector html.dark
    document.documentElement.classList.add('dark')
  }

  // ── 2. Inicializar el router ───────────────────────────────
  // El router lee el hash actual de la URL y renderiza la vista correspondiente
  // También registra el listener para futuros cambios de hash
  initRouter()
}

// ── DOMContentLoaded ─────────────────────────────────────────
// Esperamos a que el DOM esté listo antes de arrancar la app.
// DOMContentLoaded se dispara cuando el HTML fue parseado,
// sin esperar a que carguen las imágenes u otros recursos.
document.addEventListener('DOMContentLoaded', bootstrap)
