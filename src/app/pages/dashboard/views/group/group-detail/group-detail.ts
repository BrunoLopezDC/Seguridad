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
import { UserPermissions } from '../../../../../core/mocks/auth.mock';

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

  editedGroup: GroupInfo = { id: 0, name: '', description: '' };
  newMemberEmail = '';

  // Datos simulados de grupos
  private groupsData: GroupInfo[] = [
    { id: 1, name: 'Administradores', description: 'Grupo con acceso total' },
    { id: 2, name: 'Soporte', description: 'Atención de incidencias' },
    { id: 3, name: 'Desarrollo', description: 'Equipo técnico' }
  ];

  // Miembros por grupo
  private membersByGroupId: Record<number, GroupMember[]> = {
    1: [
      { id: 1, name: 'Admin Sistema', email: 'admin@seguridad.com', role: 'admin', joinedAt: new Date('2025-06-15') },
      { id: 2, name: 'Usuario Demo', email: 'usuario@seguridad.com', role: 'member', joinedAt: new Date('2025-08-20') }
    ],
    2: [
      { id: 3, name: 'María García', email: 'maria@seguridad.com', role: 'admin', joinedAt: new Date('2026-01-10') },
      { id: 4, name: 'Carlos Ruiz', email: 'carlos@seguridad.com', role: 'member', joinedAt: new Date('2026-01-12') }
    ],
    3: [
      { id: 5, name: 'Ana López', email: 'ana@seguridad.com', role: 'admin', joinedAt: new Date('2026-02-01') }
    ]
  };

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.loadGroup(Number(params['id']));
    });
  }

  get permissions(): UserPermissions {
    return this.permissionService.getPermissions();
  }

  hasAccess(): boolean {
    return this.permissionService.hasAnyPermission('groupAdd', 'groupEdit', 'groupDelete');
  }

  private loadGroup(id: number): void {
    const found = this.groupsData.find(g => g.id === id);

    if (!found) {
      this.router.navigate(['/dashboard/group']);
      return;
    }

    this.group.set({ ...found });
    this.members.set([...(this.membersByGroupId[id] ?? [])]);
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

    this.group.set({ ...this.editedGroup });
    this.settingsDialogVisible = false;
    this.submitted = false;
    this.showSuccess('Configuración actualizada correctamente.');
  }

  openAddMember(): void {
    this.newMemberEmail = '';
    this.submitted = false;
    this.addMemberDialogVisible = true;
  }

  addMember(): void {
    this.submitted = true;

    if (!this.newMemberEmail.trim()) {
      this.showError('El correo es obligatorio.');
      return;
    }

    if (!this.isValidEmail(this.newMemberEmail)) {
      this.showError('Ingresa un correo válido.');
      return;
    }

    const exists = this.members().some(
      m => m.email.toLowerCase() === this.newMemberEmail.toLowerCase()
    );

    if (exists) {
      this.showError('Ese usuario ya pertenece al grupo.');
      return;
    }

    const newMember: GroupMember = {
      id: this.nextMemberId(),
      name: 'Nuevo Usuario',
      email: this.newMemberEmail,
      role: 'member',
      joinedAt: new Date()
    };

    this.members.update(list => [...list, newMember]);
    this.addMemberDialogVisible = false;
    this.submitted = false;
    this.showSuccess('Usuario agregado correctamente.');
  }

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
        this.showSuccess('Usuario eliminado del grupo.');
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