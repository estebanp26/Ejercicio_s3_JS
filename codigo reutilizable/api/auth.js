// ============================================================
// src/api/auth.js
// Funciones para autenticación contra json-server.
// json-server NO tiene un endpoint de login real, así que
// simulamos la autenticación: buscamos el usuario por email
// y verificamos la contraseña manualmente en el cliente.
// ============================================================

// URL base del json-server (corre en puerto 3000)
const BASE_URL = 'http://localhost:3000'

/**
 * Intenta iniciar sesión con email y contraseña.
 * Busca en json-server un usuario con ese email,
 * luego verifica la contraseña manualmente.
 *
 * @param {string} email    - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} El objeto usuario sin la contraseña
 * @throws {Error} Si las credenciales son incorrectas o hay un error de red
 */
export async function login(email, password) {
  // Hacemos GET a /users?email=... para filtrar por email en json-server
  // El parámetro ?email= filtra los resultados que tengan ese email
  const response = await fetch(`${BASE_URL}/users?email=${encodeURIComponent(email)}`)

  // Si la respuesta no es exitosa (código 2xx), lanzamos un error
  if (!response.ok) {
    throw new Error('Error al conectar con el servidor')
  }

  // Convertimos la respuesta JSON a un array de usuarios
  const users = await response.json()

  // Si no encontramos ningún usuario con ese email
  if (users.length === 0) {
    throw new Error('Correo electrónico no registrado')
  }

  // Tomamos el primer (y único) usuario con ese email
  const user = users[0]

  // Verificamos la contraseña (comparación simple — en producción
  // real esto se haría en el servidor con hashing)
  if (user.password !== password) {
    throw new Error('Contraseña incorrecta')
  }

  // Retornamos el usuario SIN la contraseña por seguridad
  // El operador spread (...) copia todas las propiedades excepto password
  const { password: _pwd, ...safeUser } = user
  return safeUser
}
