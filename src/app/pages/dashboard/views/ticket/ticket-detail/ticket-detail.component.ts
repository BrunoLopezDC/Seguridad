import { Component, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { MessageModule } from 'primeng/message';

// Servicios
import { TicketService } from '../../../../../core/services/ticket.service';
import { UserService } from '../../../../../core/services/user.service';

interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estadoActual: string;
  asignadoA: string;
  idUsuarioAsignado?: number;
  prioridad: string;
  fechaCreacion: Date;
  fechaLimite: Date;
  comentarios: string;
  historialCambios: HistorialCambio[];
}

interface HistorialCambio {
  fecha: Date;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  usuario: string;
}

interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, CardModule, InputTextModule,
    Textarea, FloatLabelModule, ButtonModule, SelectModule,
    DatePickerModule, TagModule, TimelineModule, MessageModule
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {

  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  ticket = signal<Ticket | null>(null);
  isEditing = signal<boolean>(false);
  submitted = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  editableTicket: Ticket | null = null;

  estadosOptions: SelectOption[] = [
    { label: 'Abierto', value: 'abierto' },
    { label: 'En Progreso', value: 'en_progreso' },
    { label: 'Resuelto', value: 'resuelto' },
    { label: 'Cerrado', value: 'cerrado' }
  ];

  prioridadOptions: SelectOption[] = [
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' },
    { label: 'Crítica', value: 'critica' }
  ];

  usuariosOptions: SelectOption[] = [];
  minDate = new Date();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.minDate.setDate(this.minDate.getDate() + 1);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData(id);
  }

  private loadData(id: number): void {
    // Cargar opciones de usuarios para el selector
    this.userService.getUsers().subscribe(users => {
      setTimeout(() => {
        this.usuariosOptions = users.map(u => ({ label: u.nombreCompleto, value: u.idUsuario }));
      }, 0);
    });

    // Cargar datos del ticket
    this.ticketService.getTicketById(id).subscribe({
      next: (dbTicket) => {
        const mappedTicket: Ticket = {
          id: dbTicket.idTicket,
          titulo: dbTicket.titulo,
          descripcion: dbTicket.descripcion,
          estadoActual: dbTicket.estadoActual,
          asignadoA: dbTicket.asignadoA || 'Sin asignar',
          idUsuarioAsignado: dbTicket.idUsuarioAsignado ? Number(dbTicket.idUsuarioAsignado) : undefined,
          prioridad: dbTicket.prioridad,
          fechaCreacion: new Date(dbTicket.fechaCreacion),
          fechaLimite: dbTicket.fechaLimite ? new Date(dbTicket.fechaLimite) : new Date(),
          comentarios: dbTicket.comentarios || '',
          historialCambios: (dbTicket.historial || []).map((h: any) => ({
            fecha: new Date(h.fechaCambio),
            campo: h.campoModificado,
            valorAnterior: h.valorAnterior,
            valorNuevo: h.valorNuevo,
            usuario: h.modificador?.nombreCompleto || 'Sistema'
          }))
        };
        this.ticket.set(mappedTicket);
      },
      error: () => this.goBack()
    });
  }

  enableEdit(): void {
    const current = this.ticket();
    if (current) {
      this.editableTicket = { ...current };
      this.isEditing.set(true);
    }
  }

  cancelEdit(): void {
    this.editableTicket = null;
    this.isEditing.set(false);
    this.submitted.set(false);
  }

  saveChanges(): void {
    this.submitted.set(true);

    if (!this.editableTicket || !this.editableTicket.titulo.trim() || !this.editableTicket.descripcion.trim()) {
      return;
    }

    const id = this.editableTicket.id;
    const body = {
      titulo: this.editableTicket.titulo,
      descripcion: this.editableTicket.descripcion,
      estadoActual: this.editableTicket.estadoActual,
      prioridad: this.editableTicket.prioridad,
      idUsuarioAsignado: this.editableTicket.idUsuarioAsignado || null,
      fechaLimite: this.editableTicket.fechaLimite,
      comentarios: this.editableTicket.comentarios,
      // Enviamos el ID del usuario que edita para que el historial lo registre
      idUsuarioModificador: 3 // Cambiar por el ID del usuario logueado en el futuro
    };

    this.ticketService.updateTicket(id, body).subscribe({
      next: () => {
        this.showSuccess('Ticket actualizado correctamente.');
        this.isEditing.set(false);
        this.submitted.set(false);
        this.loadData(id); 
      },
      error: () => {
        this.showError('Error al guardar cambios.');
        this.submitted.set(false);
      }
    });
  }

  goBack(): void { this.router.navigate(['/dashboard/tickets']); }

  private showSuccess(msg: string) { this.successMessage.set(msg); setTimeout(() => this.successMessage.set(''), 3000); }
  private showError(msg: string) { this.errorMessage.set(msg); setTimeout(() => this.errorMessage.set(''), 3000); }

  getEstadoSeverity(estado: string): any {
    const map: any = { 'abierto': 'info', 'en_progreso': 'warn', 'resuelto': 'success', 'cerrado': 'danger' };
    return map[estado] || 'info';
  }

  getPrioridadSeverity(prioridad: string): any {
    const map: any = { 'baja': 'success', 'media': 'info', 'alta': 'warn', 'critica': 'danger' };
    return map[prioridad] || 'info';
  }

  getEstadoLabel(estado: string): string {
    return this.estadosOptions.find(e => e.value === estado)?.label || estado;
  }

  getPrioridadLabel(prioridad: string): string {
    return this.prioridadOptions.find(p => p.value === prioridad)?.label || prioridad;
  }
}