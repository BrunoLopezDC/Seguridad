import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
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

interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estadoActual: string;
  asignadoA: string;
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
  value: string;
}

@Component({
  selector: 'app-ticket-detail',
  imports: [
    FormsModule,
    DatePipe,
    CardModule,
    InputTextModule,
    Textarea,
    FloatLabelModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    TimelineModule,
    MessageModule
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {

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

  usuariosOptions: SelectOption[] = [
    { label: 'Juan Pérez', value: 'Juan Pérez' },
    { label: 'María García', value: 'María García' },
    { label: 'Carlos López', value: 'Carlos López' }
  ];

  minDate = new Date();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.minDate.setDate(this.minDate.getDate() + 1);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  private loadTicket(id: number): void {
    // TODO: cuando integres backend, hacer llamada al servicio
    // Por ahora simulamos datos
    const mockTicket: Ticket = {
      id,
      titulo: 'Error en login',
      descripcion: 'Los usuarios no pueden iniciar sesión desde la versión 2.0',
      estadoActual: 'en_progreso',
      asignadoA: 'Juan Pérez',
      prioridad: 'alta',
      fechaCreacion: new Date('2026-03-01'),
      fechaLimite: new Date('2026-03-10'),
      comentarios: 'Revisar el servicio de autenticación OAuth',
      historialCambios: [
        {
          fecha: new Date('2026-03-01T10:30:00'),
          campo: 'Estado',
          valorAnterior: 'Abierto',
          valorNuevo: 'En Progreso',
          usuario: 'Admin Sistema'
        },
        {
          fecha: new Date('2026-03-02T14:15:00'),
          campo: 'Asignado a',
          valorAnterior: 'Sin asignar',
          valorNuevo: 'Juan Pérez',
          usuario: 'Admin Sistema'
        },
        {
          fecha: new Date('2026-03-03T09:00:00'),
          campo: 'Prioridad',
          valorAnterior: 'Media',
          valorNuevo: 'Alta',
          usuario: 'María García'
        }
      ]
    };

    this.ticket.set(mockTicket);
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 3000);
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

    if (!this.editableTicket) return;

    if (!this.editableTicket.titulo.trim() || !this.editableTicket.descripcion.trim()) {
      this.showError('Completa los campos obligatorios.');
      return;
    }

    const original = this.ticket();
    if (!original) return;

    // Registrar cambios en historial
    const cambios: HistorialCambio[] = [];
    const usuario = 'Admin Sistema'; // TODO: obtener del servicio de auth

    if (original.estadoActual !== this.editableTicket.estadoActual) {
      cambios.push({
        fecha: new Date(),
        campo: 'Estado',
        valorAnterior: this.getEstadoLabel(original.estadoActual),
        valorNuevo: this.getEstadoLabel(this.editableTicket.estadoActual),
        usuario
      });
    }

    if (original.prioridad !== this.editableTicket.prioridad) {
      cambios.push({
        fecha: new Date(),
        campo: 'Prioridad',
        valorAnterior: this.getPrioridadLabel(original.prioridad),
        valorNuevo: this.getPrioridadLabel(this.editableTicket.prioridad),
        usuario
      });
    }

    if (original.asignadoA !== this.editableTicket.asignadoA) {
      cambios.push({
        fecha: new Date(),
        campo: 'Asignado a',
        valorAnterior: original.asignadoA || 'Sin asignar',
        valorNuevo: this.editableTicket.asignadoA || 'Sin asignar',
        usuario
      });
    }

    // Actualizar ticket con nuevo historial
    const updatedTicket: Ticket = {
      ...this.editableTicket,
      historialCambios: [...cambios, ...original.historialCambios]
    };

    this.ticket.set(updatedTicket);
    this.isEditing.set(false);
    this.submitted.set(false);
    this.editableTicket = null;
    this.showSuccess('Ticket actualizado correctamente.');
  }

  goBack(): void {
    this.router.navigate(['/dashboard/tickets']);
  }

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'abierto': 'info',
      'en_progreso': 'warn',
      'resuelto': 'success',
      'cerrado': 'danger'
    };
    return map[estado] || 'info';
  }

  getPrioridadSeverity(prioridad: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'baja': 'success',
      'media': 'info',
      'alta': 'warn',
      'critica': 'danger'
    };
    return map[prioridad] || 'info';
  }

  getEstadoLabel(estado: string): string {
    const found = this.estadosOptions.find(e => e.value === estado);
    return found ? found.label : estado;
  }

  getPrioridadLabel(prioridad: string): string {
    const found = this.prioridadOptions.find(p => p.value === prioridad);
    return found ? found.label : prioridad;
  }
}