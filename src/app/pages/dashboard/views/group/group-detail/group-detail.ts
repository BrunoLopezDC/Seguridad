import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { AvatarModule } from 'primeng/avatar';
import { PermissionService } from '../../../../../core/services/permission.service';
import { GroupService } from '../../../../../core/services/group.service';
import { UserService } from '../../../../../core/services/user.service'; // <-- 1. Importamos UserService

interface GroupMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

interface GroupInfo {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-group-detail',
  imports: [
    FormsModule,
    DatePipe,
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
    AvatarModule
  ],
  providers: [ConfirmationService],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.css'
})
export class GroupDetailComponent implements OnInit {

  group = signal<GroupInfo | null>(null);
  members = signal<GroupMember[]>([]);

  successMessage = signal('');
  errorMessage = signal('');

  settingsDialogVisible = false;
  addMemberDialogVisible = false;
  submitted = false;
  isLoading = signal<boolean>(false);

  editedGroup: GroupInfo = { id: 0, name: '', description: '' };
  newMemberEmail = '';

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly permissionService: PermissionService,
    private readonly groupService: GroupService,
    private readonly userService: UserService // <-- 2. Inyectamos UserService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const groupId = Number(params['id']);
      this.loadRealGroup(groupId);
      this.loadGroupMembers(groupId); // <-- 3. Llamamos a la carga de miembros reales
    });
  }

  get permissions(): any {
    return this.permissionService.getPermissions();
  }

  hasAccess(): boolean {
    return this.permissionService.hasAnyPermission('groupAdd', 'groupEdit', 'groupDelete');
  }

private loadRealGroup(id: number): void {
    this.isLoading.set(true);
    this.groupService.getGroupById(id).subscribe({
      next: (dbGroup) => {
        // 1. Cargamos la info del grupo
        this.group.set({
          id: dbGroup.idGrupo,
          name: dbGroup.nombreGrupo,
          description: dbGroup.descripcion || 'Sin descripción'
        });

        // 2. Mapeamos los miembros que ya vienen incluidos en dbGroup
        // Asumiendo que tu backend devuelve un arreglo llamado 'miembros' o similar
        if (dbGroup.miembros) {
          const mappedMembers: GroupMember[] = dbGroup.miembros.map((m: any) => ({
            id: m.usuario.idUsuario,
            name: m.usuario.nombreCompleto,
            email: m.usuario.correoElectronico,
            role: m.usuario.departamento === 'IT' ? 'admin' : 'member',
            joinedAt: new Date(m.fechaAsignacion)
          }));
          this.members.set(mappedMembers);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar grupo', err);
        this.router.navigate(['/dashboard/group']);
      }
    });
  }

  // <-- 4. Carga REAL de miembros usando tu UserService
  private loadGroupMembers(groupId: number): void {
    this.userService.getUsers().subscribe({
      next: (allUsers) => {
        // Filtramos para obtener solo los usuarios asignados a este grupo
        // (Ajusta la propiedad 'idGrupo' según cómo lo devuelva tu backend en el JSON)
        const groupUsers = allUsers.filter(u => u.idGrupo === groupId);

        const mappedMembers: GroupMember[] = groupUsers.map(u => ({
          id: u.idUsuario,
          name: u.nombreCompleto,
          email: u.correoElectronico,
          // Lógica básica para el rol visual: Si es de IT lo marcamos admin, si no, miembro.
          role: u.departamento === 'IT' ? 'admin' : 'member', 
          joinedAt: u.fechaCreacion ? new Date(u.fechaCreacion) : new Date()
        }));

        this.members.set(mappedMembers);
      },
      error: (err) => console.error('Error al cargar miembros del grupo', err)
    });
  }

  private nextMemberId(): number {
    const ids = this.members().map(m => m.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 3000);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/group']);
  }

  openEditSettings(): void {
    this.editedGroup = { ...this.group()! };
    this.submitted = false;
    this.settingsDialogVisible = true;
  }

  saveGroupSettings(): void {
    this.submitted = true;

    if (!this.editedGroup.name.trim()) {
      this.showError('El nombre del grupo es obligatorio.');
      return;
    }

    this.groupService.updateGroup(this.editedGroup.id, this.editedGroup.name, this.editedGroup.description).subscribe({
      next: () => {
        this.group.set({ ...this.editedGroup });
        this.settingsDialogVisible = false;
        this.submitted = false;
        this.showSuccess('Configuración actualizada correctamente en la BD.');
      },
      error: (err) => {
        console.error('Error al actualizar', err);
        this.showError('Ocurrió un error al guardar los cambios.');
      }
    });
  }

  openAddMember(): void {
    this.newMemberEmail = '';
    this.submitted = false;
    this.addMemberDialogVisible = true;
  }

  // La lógica de AGREGAR miembros la dejamos visual por ahora, como pediste
  addMember(): void {
    this.submitted = true;

    if (!this.newMemberEmail.trim()) {
      this.showError('El correo es obligatorio.'); return;
    }
    if (!this.isValidEmail(this.newMemberEmail)) {
      this.showError('Ingresa un correo válido.'); return;
    }

    const exists = this.members().some(m => m.email.toLowerCase() === this.newMemberEmail.toLowerCase());
    if (exists) {
      this.showError('Ese usuario ya pertenece al grupo.'); return;
    }

    const newMember: GroupMember = {
      id: this.nextMemberId(), name: 'Nuevo Usuario', email: this.newMemberEmail, role: 'member', joinedAt: new Date()
    };

    this.members.update(list => [...list, newMember]);
    this.addMemberDialogVisible = false;
    this.submitted = false;
    this.showSuccess('Usuario agregado.');
  }

  // La lógica de ELIMINAR miembros la dejamos visual por ahora
  confirmRemoveMember(member: GroupMember): void {
    if (member.role === 'admin') {
      this.showError('No se puede eliminar al administrador del grupo.');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar a <strong>${member.name}</strong> del grupo?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.members.update(list => list.filter(m => m.id !== member.id));
        this.showSuccess('Usuario eliminado.');
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(role: 'admin' | 'member'): string {
    return role === 'admin' ? 'Administrador' : 'Miembro';
  }

  getRoleSeverity(role: 'admin' | 'member'): 'warn' | 'info' {
    return role === 'admin' ? 'warn' : 'info';
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}