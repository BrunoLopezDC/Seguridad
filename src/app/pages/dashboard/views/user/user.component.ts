import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { Router } from '@angular/router';
import { PermissionService } from '../../../../core/services/permission.service';
import { UserPermissions } from '../../../../core/mocks/auth.mock';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-user',
  imports: [
    FormsModule,
    CardModule,
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    MessageModule,
    TagModule,
    TooltipModule,
    SelectModule
  ],
  providers: [ConfirmationService],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {

  users = signal<User[]>([
    { id: 1, name: 'Admin Sistema', email: 'admin@seguridad.com', role: 'admin' },
    { id: 2, name: 'Usuario Demo', email: 'usuario@seguridad.com', role: 'user' }
  ]);

  roles: RoleOption[] = [
    { label: 'Usuario', value: 'user' },
    { label: 'Administrador', value: 'admin' }
  ];

  dialogVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  submitted = signal<boolean>(false);

  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  currentUser: User = this.emptyUser();

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Getter de permisos
   */
  get permissions(): UserPermissions {
    return this.permissionService.getPermissions();
  }

  /**
   * Verificar permisos
   */
  canCreateUser(): boolean {
    return this.permissionService.hasPermission('userCreate');
  }

  canEditUser(): boolean {
    return this.permissionService.hasPermission('userEdit');
  }

  canDeleteUser(): boolean {
    return this.permissionService.hasPermission('userDelete');
  }

  /**
   * Helpers privados
   */
  private emptyUser(): User {
    return { id: 0, name: '', email: '', role: 'user' };
  }

  private nextId(): number {
    const ids = this.users().map(u => u.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 3000);
  }

  /**
   * CRUD operations
   */
  openNew(): void {
    if (!this.canCreateUser()) {
      this.showError('No tienes permiso para crear usuarios.');
      return;
    }

    this.currentUser = this.emptyUser();
    this.isEditing.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  openEdit(user: User): void {
    if (!this.canEditUser()) {
      this.showError('No tienes permiso para editar usuarios.');
      return;
    }

    this.currentUser = { ...user };
    this.isEditing.set(true);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  saveUser(): void {
    this.submitted.set(true);

    if (!this.currentUser.name.trim() || !this.currentUser.email.trim()) {
      this.showError('Completa todos los campos obligatorios.');
      return;
    }

    if (this.isEditing()) {
      if (!this.canEditUser()) {
        this.showError('No tienes permiso para editar usuarios.');
        return;
      }

      this.users.update(list =>
        list.map(u => u.id === this.currentUser.id ? { ...this.currentUser } : u)
      );
      this.showSuccess('Usuario actualizado correctamente.');
    } else {
      if (!this.canCreateUser()) {
        this.showError('No tienes permiso para crear usuarios.');
        return;
      }

      const newUser: User = { ...this.currentUser, id: this.nextId() };
      this.users.update(list => [...list, newUser]);
      this.showSuccess('Usuario creado correctamente.');
    }

    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  confirmDelete(user: User): void {
    if (!this.canDeleteUser()) {
      this.showError('No tienes permiso para eliminar usuarios.');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar al usuario <strong>${user.name}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.showSuccess('Usuario eliminado correctamente.');
      }
    });
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' {
    return role === 'admin' ? 'warn' : 'info';
  }

  getRoleLabel(role: string): string {
    const found = this.roles.find(r => r.value === role);
    return found ? found.label : role;
  }

  viewProfile(user: User): void {
    this.router.navigate(['/dashboard/user', user.id]);
  }
}