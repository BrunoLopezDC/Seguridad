import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';

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

  private allUsers: UserProfile[] = [
    { id: 1, name: 'Admin Sistema', email: 'admin@seguridad.com', role: 'admin', fechaRegistro: new Date('2025-06-15'), telefono: '+52 555 123 4567', departamento: 'Desarrollo' },
    { id: 2, name: 'Usuario Demo', email: 'usuario@seguridad.com', role: 'user', fechaRegistro: new Date('2025-08-20'), telefono: '+52 555 987 6543', departamento: 'Soporte' }
  ];

  private allTickets: Ticket[] = [
    { id: 1, titulo: 'Error en login', estadoActual: 'abierto', prioridad: 'alta', fechaCreacion: new Date('2026-03-01'), fechaLimite: new Date('2026-03-10') },
    { id: 2, titulo: 'Mejora en dashboard', estadoActual: 'en_progreso', prioridad: 'media', fechaCreacion: new Date('2026-03-03'), fechaLimite: new Date('2026-03-15') },
    { id: 3, titulo: 'Bug en reportes', estadoActual: 'resuelto', prioridad: 'critica', fechaCreacion: new Date('2026-02-28'), fechaLimite: new Date('2026-03-05') },
    { id: 4, titulo: 'Actualizar docs', estadoActual: 'abierto', prioridad: 'baja', fechaCreacion: new Date('2026-03-05'), fechaLimite: new Date('2026-03-20') },
    { id: 5, titulo: 'Optimizar DB', estadoActual: 'en_progreso', prioridad: 'alta', fechaCreacion: new Date('2026-03-02'), fechaLimite: new Date('2026-03-12') },
    { id: 6, titulo: 'Nueva landing', estadoActual: 'cerrado', prioridad: 'media', fechaCreacion: new Date('2026-02-25'), fechaLimite: new Date('2026-03-01') }
  ];

  private userTicketsMap: Record<number, number[]> = {
    1: [1, 3, 4],
    2: [2, 5, 6]
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = +params['id'];
      this.loadUser(userId);
    });
  }

  private loadUser(id: number): void {
    const found = this.allUsers.find(u => u.id === id);
    if (found) {
      this.user.set(found);
    } else {
      this.router.navigate(['/dashboard/user']);
    }
  }

  get userTickets(): Ticket[] {
    if (!this.user()) return [];
    const ticketIds = this.userTicketsMap[this.user()!.id] || [];
    return this.allTickets.filter(t => ticketIds.includes(t.id));
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
      'abierto': 'info', 'en_progreso': 'warn', 'resuelto': 'success', 'cerrado': 'danger'
    };
    return map[estado] || 'info';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      'abierto': 'Pendiente', 'en_progreso': 'En Progreso', 'resuelto': 'Revisión', 'cerrado': 'Cerrado'
    };
    return map[estado] || estado;
  }

  getPrioridadSeverity(p: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'baja': 'success', 'media': 'info', 'alta': 'warn', 'critica': 'danger'
    };
    return map[p] || 'info';
  }

  getPrioridadLabel(p: string): string {
    const map: Record<string, string> = { 'baja': 'Baja', 'media': 'Media', 'alta': 'Alta', 'critica': 'Crítica' };
    return map[p] || p;
  }
}