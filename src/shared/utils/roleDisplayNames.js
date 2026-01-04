/**
 * Mapeo de roles internos a nombres para mostrar al usuario
 * Los valores de la izquierda son los valores técnicos en la BD
 * Los valores de la derecha son lo que ve el usuario
 */
export const roleDisplayNames = {
  admin: 'Decano',
  super_admin: 'Rector',
  coordinador: 'Coordinador',
  profesor: 'Profesor',
  estudiante: 'Estudiante',
};

/**
 * Obtiene el nombre amigable de un rol
 * @param {string} role - Rol técnico (ej: 'admin')
 * @returns {string} - Nombre amigable (ej: 'Decano')
 */
export const getDisplayName = (role) => {
  return roleDisplayNames[role] || role;
};

/**
 * Obtiene el nombre amigable para múltiples roles
 * @param {array} roles - Array de roles técnicos
 * @returns {array} - Array de nombres amigables
 */
export const getDisplayNames = (roles = []) => {
  return roles.map((role) => getDisplayName(role));
};
