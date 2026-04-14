import { Component, signal, OnInit } from '@angular/core';
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
import { GroupService } from '../../../../core/services/group.service';

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
export class GroupComponent implements OnInit {

  groups = signal<Group[]>([]);
  isLoading = signal<boolean>(false);

  dialogVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  submitted = signal<boolean>(false);

  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  currentGroup: Group = this.emptyGroup();

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly permissionService: PermissionService,
    private readonly groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading.set(true);
    this.groupService.getGroups().subscribe({
      next: (data) => {
        const mapped = data.map(g => ({
          id: g.idGrupo,
          name: g.nombreGrupo,
          description: g.descripcion || 'Sin descripción',
          maxMembers: 10, // Dato estático visual por ahora
          active: true // Dato estático visual por ahora
        }));
        this.groups.set(mapped);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando grupos', err);
        this.showError('Error al conectar con el servidor.');
        this.isLoading.set(false);
      }
    });
  }

  get permissions(): any {
    return this.permissionService.getPermissions();
  }

  canAddGroup(): boolean {
    return this.permissionService.hasPermission('groupAdd');
  }

  canEditGroup(): boolean {
    return this.permissionService.hasPermission('groupEdit');
  }

  canDeleteGroup(): boolean {
    return this.permissionService.hasPermission('groupDelete');
  }

  private emptyGroup(): Group {
    return { id: 0, name: '', description: '', maxMembers: 10, active: true };
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 3000);
  }

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
      
      // Llamada real al backend para EDITAR
      this.groupService.updateGroup(this.currentGroup.id, this.currentGroup.name, this.currentGroup.description).subscribe({
        next: () => {
          this.showSuccess('Grupo actualizado correctamente.');
          this.loadGroups();
          this.dialogVisible.set(false);
        },
        error: (err) => {
          console.error('Error actualizando grupo', err);
          this.showError('Ocurrió un error al actualizar el grupo.');
        }
      });
      
    } else {
      if (!this.canAddGroup()) {
        this.showError('No tienes permiso para crear grupos.');
        return;
      }

      // Llamada real al backend para CREAR
      this.groupService.createGroup(this.currentGroup.name, this.currentGroup.description).subscribe({
        next: () => {
          this.showSuccess('Grupo creado correctamente.');
          this.loadGroups(); 
          this.dialogVisible.set(false);
        },
        error: (err) => {
          console.error('Error creando grupo', err);
          this.showError('Ocurrió un error al crear el grupo.');
        }
      });
    }
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
        // Llamada real al backend para ELIMINAR
        this.groupService.deleteGroup(group.id).subscribe({
          next: () => {
            this.showSuccess('Grupo eliminado correctamente.');
            this.loadGroups();
          },
          error: (err) => {
            console.error('Error eliminando grupo', err);
            this.showError('No se pudo eliminar el grupo.');
          }
        });
      }
    });
  }

  manageGroup(group: Group): void {
    this.router.navigate(['/dashboard/group', group.id]);
  }
}