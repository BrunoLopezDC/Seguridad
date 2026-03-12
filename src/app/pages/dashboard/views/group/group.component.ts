import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { PermissionService } from '../../../../core/services/permission.service';
import { UserPermissions } from '../../../../core/mocks/auth.mock';

interface Group {
  id: number;
  name: string;
  description: string;
  maxMembers: number;
  active: boolean;
}

@Component({
  selector: 'app-group',
  imports: [
    FormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    FloatLabelModule,
    ButtonModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    MessageModule,
    TagModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './group.component.html',
  styleUrl: './group.component.css'
})
export class GroupComponent {

  groups = signal<Group[]>([
    { id: 1, name: 'Administradores', description: 'Grupo con acceso total', maxMembers: 5, active: true },
    { id: 2, name: 'Soporte',         description: 'Atención a usuarios',    maxMembers: 10, active: true },
    { id: 3, name: 'Auditores',       description: 'Solo lectura',           maxMembers: 8, active: false }
  ]);

  dialogVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  submitted = signal<boolean>(false);

  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  currentGroup: Group = this.emptyGroup();

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
  canAddGroup(): boolean {
    return this.permissionService.hasPermission('groupAdd');
  }

  canEditGroup(): boolean {
    return this.permissionService.hasPermission('groupEdit');
  }

  canDeleteGroup(): boolean {
    return this.permissionService.hasPermission('groupDelete');
  }

  /**
   * Helpers privados
   */
  private emptyGroup(): Group {
    return { id: 0, name: '', description: '', maxMembers: 10, active: true };
  }

  private nextId(): number {
    const ids = this.groups().map(g => g.id);
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
    if (!this.canAddGroup()) {
      this.showError('No tienes permiso para crear grupos.');
      return;
    }

    this.currentGroup = this.emptyGroup();
    this.isEditing.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  openEdit(group: Group): void {
    if (!this.canEditGroup()) {
      this.showError('No tienes permiso para editar grupos.');
      return;
    }

    this.currentGroup = { ...group };
    this.isEditing.set(true);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  saveGroup(): void {
    this.submitted.set(true);

    if (!this.currentGroup.name.trim()) {
      this.showError('El nombre del grupo es obligatorio.');
      return;
    }

    if (this.isEditing()) {
      if (!this.canEditGroup()) {
        this.showError('No tienes permiso para editar grupos.');
        return;
      }

      this.groups.update(list =>
        list.map(g => g.id === this.currentGroup.id ? { ...this.currentGroup } : g)
      );
      this.showSuccess('Grupo actualizado correctamente.');
    } else {
      if (!this.canAddGroup()) {
        this.showError('No tienes permiso para crear grupos.');
        return;
      }

      const newGroup: Group = { ...this.currentGroup, id: this.nextId() };
      this.groups.update(list => [...list, newGroup]);
      this.showSuccess('Grupo creado correctamente.');
    }

    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  confirmDelete(group: Group): void {
    if (!this.canDeleteGroup()) {
      this.showError('No tienes permiso para eliminar grupos.');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el grupo <strong>${group.name}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.groups.update(list => list.filter(g => g.id !== group.id));
        this.showSuccess('Grupo eliminado correctamente.');
      }
    });
  }

  manageGroup(group: Group): void {
    this.router.navigate(['/dashboard/group', group.id]);
  }
}