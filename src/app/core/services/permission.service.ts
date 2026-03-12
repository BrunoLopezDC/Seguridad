import { Injectable, signal } from '@angular/core';
import { MOCK_USERS, CURRENT_USER_EMAIL, UserPermissions, MockUser } from '../mocks/auth.mock';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private currentUserEmail = signal<string>(CURRENT_USER_EMAIL);
  private currentUser = signal<MockUser | null>(this.findUserByEmail(CURRENT_USER_EMAIL));

  constructor() {}

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): MockUser | null {
    return this.currentUser();
  }

  getCurrentUserEmail(): string {
    return this.currentUserEmail();
  }

  /**
   * Obtener permisos del usuario actual
   */
  getPermissions(): UserPermissions {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        groupAdd: false,
        groupEdit: false,
        groupDelete: false,
        ticketCreate: false,
        ticketEdit: false,
        ticketDelete: false,
        userCreate: false,
        userEdit: false,
        userDelete: false
      };
    }
    return user.permissions;
  }

  /**
   * Verificar si el usuario actual tiene un permiso específico
   */
  hasPermission(permission: keyof UserPermissions): boolean {
    return this.getPermissions()[permission] as boolean;
  }

  /**
   * Verificar múltiples permisos (AND: debe tener TODOS)
   */
  hasAllPermissions(...permissions: Array<keyof UserPermissions>): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Verificar múltiples permisos (OR: debe tener AL MENOS UNO)
   */
  hasAnyPermission(...permissions: Array<keyof UserPermissions>): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Cambiar usuario autenticado (solo para desarrollo)
   */
  setCurrentUser(email: string): void {
    const user = this.findUserByEmail(email);
    if (user) {
      this.currentUserEmail.set(email);
      this.currentUser.set(user);
    }
  }

  /**
   * Obtener todos los usuarios mock
   */
  getAllUsers(): MockUser[] {
    return MOCK_USERS;
  }

  /**
   * Buscar usuario por email
   */
  private findUserByEmail(email: string): MockUser | null {
    return MOCK_USERS.find(u => u.email === email) ?? null;
  }
}