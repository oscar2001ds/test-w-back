import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { 
  UserRole, 
  canCreateRole, 
  canModifyRole, 
  getAssignableRoles,
  getRoleLevel 
} from '../../common/enums/user-role.enum';

@Injectable()
export class AuthorizationService {
  /**
   * Verifica si un usuario puede crear otro usuario con un rol específico
   */
  canUserCreateRole(creatorUser: User, targetRole: UserRole): boolean {
    return canCreateRole(creatorUser.role, targetRole);
  }

  /**
   * Verifica si un usuario puede modificar otro usuario
   */
  canUserModifyUser(currentUser: User, targetUser: User): boolean {
    // Un usuario siempre puede modificar su propio perfil (excepto rol)
    if (currentUser.id === targetUser.id) {
      return true;
    }

    // Verificar si puede modificar basado en roles
    return canModifyRole(currentUser.role, targetUser.role);
  }

  /**
   * Verifica si un usuario puede cambiar el rol de otro usuario
   */
  canUserChangeRole(currentUser: User, targetUser: User, newRole: UserRole): boolean {
    // No puede cambiar su propio rol
    if (currentUser.id === targetUser.id) {
      return false;
    }

    // Debe poder modificar al usuario objetivo
    if (!canModifyRole(currentUser.role, targetUser.role)) {
      return false;
    }

    // Debe poder asignar el nuevo rol
    if (!canCreateRole(currentUser.role, newRole)) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene los roles que un usuario puede asignar
   */
  getUserAssignableRoles(user: User): UserRole[] {
    return getAssignableRoles(user.role);
  }

  /**
   * Valida si una creación de usuario es permitida y lanza excepción si no
   */
  validateUserCreation(creatorUser: User, targetRole: UserRole): void {
    if (!this.canUserCreateRole(creatorUser, targetRole)) {
      throw new ForbiddenException(
        `Su rol '${creatorUser.role}' no puede crear usuarios con rol '${targetRole}'. ` +
        `Roles permitidos: ${this.getUserAssignableRoles(creatorUser).join(', ')}`
      );
    }
  }

  /**
   * Valida si una modificación de usuario es permitida y lanza excepción si no
   */
  validateUserModification(currentUser: User, targetUser: User): void {
    if (!this.canUserModifyUser(currentUser, targetUser)) {
      throw new ForbiddenException(
        `Su rol '${currentUser.role}' no puede modificar usuarios con rol '${targetUser.role}'`
      );
    }
  }

  /**
   * Valida si un cambio de rol es permitido y lanza excepción si no
   */
  validateRoleChange(currentUser: User, targetUser: User, newRole: UserRole): void {
    if (currentUser.id === targetUser.id) {
      throw new ForbiddenException('No puede cambiar su propio rol');
    }

    if (!canModifyRole(currentUser.role, targetUser.role)) {
      throw new ForbiddenException(
        `Su rol '${currentUser.role}' no puede modificar usuarios con rol '${targetUser.role}'`
      );
    }

    if (!canCreateRole(currentUser.role, newRole)) {
      throw new ForbiddenException(
        `Su rol '${currentUser.role}' no puede asignar el rol '${newRole}'. ` +
        `Roles permitidos: ${this.getUserAssignableRoles(currentUser).join(', ')}`
      );
    }
  }

  /**
   * Verifica si un rol es superior a otro
   */
  isRoleHigher(role1: UserRole, role2: UserRole): boolean {
    return getRoleLevel(role1) > getRoleLevel(role2);
  }

  /**
   * Verifica si un rol es igual o superior a otro
   */
  isRoleEqualOrHigher(role1: UserRole, role2: UserRole): boolean {
    return getRoleLevel(role1) >= getRoleLevel(role2);
  }
}