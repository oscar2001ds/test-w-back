export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  CLIENT = 'client',
}

/**
 * Jerarquía de roles con niveles numéricos
 * Número más alto = más permisos
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPERVISOR]: 2,
  [UserRole.CLIENT]: 1,
};

/**
 * Roles que cada nivel puede crear
 */
export const CREATABLE_ROLES: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CLIENT],
  [UserRole.ADMIN]: [UserRole.SUPERVISOR, UserRole.CLIENT],
  [UserRole.SUPERVISOR]: [UserRole.CLIENT],
  [UserRole.CLIENT]: [], // No puede crear usuarios
};

/**
 * Roles que cada nivel puede modificar (incluyendo cambio de rol)
 */
export const MODIFIABLE_ROLES: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CLIENT],
  [UserRole.ADMIN]: [UserRole.SUPERVISOR, UserRole.CLIENT],
  [UserRole.SUPERVISOR]: [],
  [UserRole.CLIENT]: [], // Solo su propio perfil, pero no cambio de rol
};

/**
 * Roles que cada rol puede acceder (en listas de usuarios)
 */
export const ACCESSIBLE_USERS_ROLES: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CLIENT],
  [UserRole.ADMIN]: [UserRole.SUPERVISOR, UserRole.CLIENT],
  [UserRole.SUPERVISOR]: [UserRole.CLIENT],
  [UserRole.CLIENT]: [], // No puede acceder a listas de usuarios
};

/**
 * Obtiene el nivel jerárquico de un rol
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role];
}

/**
 * Verifica si un rol puede crear otro rol específico
 */
export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  return CREATABLE_ROLES[creatorRole].includes(targetRole);
}

/**
 * Verifica si un rol puede modificar otro rol
 */
export function canModifyRole(modifierRole: UserRole, targetRole: UserRole): boolean {
  return MODIFIABLE_ROLES[modifierRole].includes(targetRole);
}

/**
 * Obtiene todos los roles que un usuario puede asignar/crear
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  return CREATABLE_ROLES[userRole];
}

/**
* Verifica si un usuario puede solicitar los usuarios de un rol específico
*/
export function canUserAccessUsersRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ACCESSIBLE_USERS_ROLES[userRole].includes(targetRole);
}
