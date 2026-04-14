import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { PermissionService } from '../../../../../core/services/permission.service';
import { UserService } from '../../../../../core/services/user.service';
import { TicketService } from '../../../../../core/services/ticket.service'; // <-- Importado

interface Ticket {
  id: number;
  titulo: string;
  estadoActual: string;
  prioridad: string;
  fechaCreacion: Date;
  fechaLimite: Date;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  fechaRegistro: Date;
  telefono?: string;
  departamento?: string;
}

@Component({
  selector: 'app-user-profile',
  imports: [
    CommonModule,
    DatePipe,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    TooltipModule,
    AvatarModule,
    DividerModule
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit {
  user = signal<UserProfile | null>(null);
  
  // Guardamos los permisos en un objeto para que tu HTML iterador funcione perfecto
  targetPermissions = signal<Record<string, boolean>>({});
  isLoading = signal<boolean>(false);

  // <-- Signal para los tickets reales del usuario
  assignedTickets = signal<Ticket[]>([]);

  // Catálogo completo de permisos
  private readonly ALL_PERMISSIONS_KEYS = [
    'groupAdd', 'groupEdit', 'groupDelete', 
    'ticketCreate', 'ticketEdit', 'ticketDelete', 
    'userCreate', 'userEdit', 'userDelete'
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly permissionService: PermissionService,
    private readonly userService: UserService,
    private readonly ticketService: TicketService // <-- Inyectado
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = +params['id'];
      this.loadRealUser(userId);
      this.loadUserTickets(userId); // <-- Llamamos a la carga de tickets
    });
  }

  private loadRealUser(id: number): void {
    this.isLoading.set(true);
    this.userService.getUserProfile(id).subscribe({
      next: (dbUser) => {
        this.user.set({
          id: dbUser.idUsuario,
          name: dbUser.nombreCompleto,
          email: dbUser.correoElectronico,
          role: dbUser.departamento === 'IT' || dbUser.idUsuario === 1 ? 'admin' : 'user',
          fechaRegistro: new Date(dbUser.fechaCreacion),
          departamento: dbUser.departamento || 'Sin asignar'
        });

        const permsObj: Record<string, boolean> = {};
        this.ALL_PERMISSIONS_KEYS.forEach(key => {
          permsObj[key] = dbUser.permisos.includes(key);
        });
        
        this.targetPermissions.set(permsObj);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando usuario', err);
        this.router.navigate(['/dashboard/user']);
      }
    });
  }

  // <-- Nueva función para cargar y filtrar tickets reales
  private loadUserTickets(userId: number): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        const userTickets: Ticket[] = tickets
          .filter((t: any) => t.idUsuarioAsignado === userId)
          .map((t: any) => ({
            id: t.idTicket,
            titulo: t.titulo,
            estadoActual: t.estadoActual,
            prioridad: t.prioridad,
            fechaCreacion: new Date(t.fechaCreacion),
            fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : new Date()
          }));
        
        this.assignedTickets.set(userTickets);
      },
      error: (err) => console.error('Error al cargar los tickets del usuario', err)
    });
  }

  get userTickets(): Ticket[] {
    return this.assignedTickets(); // <-- Ahora retorna el Signal
  }

  get stats() {
    const tickets = this.userTickets;
    return {
      total: tickets.length,
      abiertos: tickets.filter(t => t.estadoActual === 'abierto').length,
      enProgreso: tickets.filter(t => t.estadoActual === 'en_progreso').length,
      resueltos: tickets.filter(t => t.estadoActual === 'resuelto').length,
      cerrados: tickets.filter(t => t.estadoActual === 'cerrado').length
    };
  }

  canViewPermissions(): boolean {
    return this.permissionService.hasPermission('userEdit');
  }

  canEditPermissions(): boolean {
    return this.permissionService.hasPermission('userEdit');
  }

  togglePermission(permissionKey: string): void {
    if (!this.canEditPermissions()) return;

    const currentUserData = this.user();
    if (!currentUserData) return;

    const currentPerms = this.targetPermissions();
    const newValue = !currentPerms[permissionKey];

    this.targetPermissions.set({
      ...currentPerms,
      [permissionKey]: newValue
    });

    this.userService.toggleUserPermission(currentUserData.id, permissionKey, newValue).subscribe({
      next: () => console.log(`Permiso ${permissionKey} actualizado a ${newValue} en BD.`),
      error: (err) => {
        console.error('Falló la actualización', err);
        this.targetPermissions.set(currentPerms);
      }
    });
  }

  countPermissions(): number {
    return Object.values(this.targetPermissions()).filter(Boolean).length;
  }

  getCategoriesList(): string[] {
    return ['Grupos', 'Tickets', 'Usuarios'];
  }

  getPermissionLabel(key: string): string {
    const labels: Record<string, string> = {
      groupAdd: 'Crear Grupo', groupEdit: 'Editar Grupo', groupDelete: 'Eliminar Grupo',
      ticketCreate: 'Crear Ticket', ticketEdit: 'Editar Ticket', ticketDelete: 'Eliminar Ticket',
      userCreate: 'Crear Usuario', userEdit: 'Editar Usuario', userDelete: 'Eliminar Usuario'
    };
    return labels[key] || key;
  }

  getPermissionCategory(key: string): string {
    if (key.startsWith('group')) return 'Grupos';
    if (key.startsWith('ticket')) return 'Tickets';
    if (key.startsWith('user')) return 'Usuarios';
    return 'Otros';
  }

  getGroupedPermissions(): Record<string, Array<{ key: string; label: string; value: boolean }>> {
    const grouped: Record<string, Array<{ key: string; label: string; value: boolean }>> = {
      Grupos: [], Tickets: [], Usuarios: []
    };

    Object.entries(this.targetPermissions()).forEach(([key, value]) => {
      const category = this.getPermissionCategory(key);
      if (grouped[category]) {
        grouped[category].push({ key, label: this.getPermissionLabel(key), value });
      }
    });

    return grouped;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/user']);
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/dashboard/tickets', ticket.id]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' {
    return role === 'admin' ? 'warn' : 'info';
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  }

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      abierto: 'info', en_progreso: 'warn', resuelto: 'success', cerrado: 'danger'
    };
    return map[estado] || 'info';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      abierto: 'Pendiente', en_progreso: 'En Progreso', resuelto: 'Revisión', cerrado: 'Cerrado'
    };
    return map[estado] || estado;
  }

  getPrioridadSeverity(p: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      baja: 'success', media: 'info', alta: 'warn', critica: 'danger'
    };
    return map[p] || 'info';
  }

  getPrioridadLabel(p: string): string {
    const map: Record<string, string> = {
      baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica'
    };
    return map[p] || p;
  }
}