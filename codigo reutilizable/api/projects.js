// ============================================================
// src/api/projects.js
// Funciones para consumir la API de proyectos en json-server.
// Implementa GET, POST, PATCH y DELETE usando la Fetch API nativa.
// Cada función es async/await para manejar las promesas de forma
// más legible que con .then().catch().
// ============================================================

// URL base del json-server
const BASE_URL = 'http://localhost:3000'

// Endpoint de proyectos
const PROJECTS_ENDPOINT = `${BASE_URL}/projects`

/**
 * Obtiene TODOS los proyectos de la base de datos.
 * Corresponde a: GET /projects
 * @returns {Array} Array de objetos proyecto
 */
export async function getAllProjects() {
  const response = await fetch(PROJECTS_ENDPOINT)

  // Si la respuesta falló, lanzamos un error descriptivo
  if (!response.ok) {
    throw new Error(`Error al obtener proyectos: ${response.status}`)
  }

  // .json() parsea el body de la respuesta como JSON
  return response.json()
}

/**
 * Obtiene un proyecto específico por su ID.
 * Corresponde a: GET /projects/:id
 * @param {number} id - ID del proyecto
 * @returns {Object} El proyecto encontrado
 */
export async function getProjectById(id) {
  const response = await fetch(`${PROJECTS_ENDPOINT}/${id}`)

  if (!response.ok) {
    // Si el status es 404, el proyecto no existe
    if (response.status === 404) {
      throw new Error('Proyecto no encontrado')
    }
    throw new Error(`Error al obtener el proyecto: ${response.status}`)
  }

  return response.json()
}

/**
 * Crea un nuevo proyecto en la base de datos.
 * Corresponde a: POST /projects
 * @param {Object} projectData - Datos del nuevo proyecto
 * @returns {Object} El proyecto creado (con su id asignado por json-server)
 */
export async function createProject(projectData) {
  // Agregamos la fecha de creación automáticamente
  const payload = {
    ...projectData,                                // Spread: copia todos los campos
    createdAt: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
  }

  const response = await fetch(PROJECTS_ENDPOINT, {
    method: 'POST',                               // Método HTTP para crear
    headers: {
      'Content-Type': 'application/json'          // Le decimos al servidor que enviamos JSON
    },
    body: JSON.stringify(payload)                 // Convertimos el objeto a string JSON
  })

  if (!response.ok) {
    throw new Error(`Error al crear el proyecto: ${response.status}`)
  }

  // json-server devuelve el objeto creado con su nuevo id
  return response.json()
}

/**
 * Actualiza parcialmente un proyecto existente.
 * Usamos PATCH en lugar de PUT porque solo actualizamos
 * los campos que cambien, no todo el objeto.
 * Corresponde a: PATCH /projects/:id
 * @param {number} id      - ID del proyecto a actualizar
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} El proyecto actualizado completo
 */
export async function updateProject(id, updates) {
  const response = await fetch(`${PROJECTS_ENDPOINT}/${id}`, {
    method: 'PATCH',                              // PATCH actualiza parcialmente
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    throw new Error(`Error al actualizar el proyecto: ${response.status}`)
  }

  return response.json()
}

/**
 * Elimina un proyecto de la base de datos.
 * Corresponde a: DELETE /projects/:id
 * @param {number} id - ID del proyecto a eliminar
 * @returns {void}
 */
export async function deleteProject(id) {
  const response = await fetch(`${PROJECTS_ENDPOINT}/${id}`, {
    method: 'DELETE'                              // DELETE elimina el recurso
  })

  if (!response.ok) {
    throw new Error(`Error al eliminar el proyecto: ${response.status}`)
  }

  // DELETE en json-server retorna un objeto vacío {}
  // No necesitamos el valor de retorno
}

/**
 * Obtiene todos los usuarios (para mostrar nombres de responsables).
 * Corresponde a: GET /users
 * @returns {Array} Array de objetos usuario (sin contraseñas)
 */
export async function getAllUsers() {
  const response = await fetch(`${BASE_URL}/users`)

  if (!response.ok) {
    throw new Error(`Error al obtener usuarios: ${response.status}`)
  }

  const users = await response.json()

  // Removemos las contraseñas de todos los usuarios por seguridad
  // map() crea un nuevo array transformando cada elemento
  return users.map(({ password: _pwd, ...safeUser }) => safeUser)
}
