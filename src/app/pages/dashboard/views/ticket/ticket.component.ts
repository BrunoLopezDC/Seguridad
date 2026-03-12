import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe, SlicePipe, NgClass } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PermissionService } from '../../../../core/services/permission.service';
import { UserPermissions } from '../../../../core/mocks/auth.mock';

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

interface KanbanColumn {
  id: string;
  titulo: string;
  estado: string;
  tickets: Ticket[];
  icon: string;
  color: string;
}

interface ViewOption {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-ticket',
  imports: [
    FormsModule,
    DatePipe,
    SlicePipe,
    NgClass,
    DragDropModule,
    CardModule,
    InputTextModule,
    Textarea,
    FloatLabelModule,
    ButtonModule,
    TableModule,
    DialogModule,
    MessageModule,
    TagModule,
    TooltipModule,
    SelectModule,
    DatePickerModule,
    SelectButtonModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.css'
})
export class TicketComponent {

  // Vista actual: 'lista' o 'kanban'
  currentView = signal<string>('lista');

  viewOptions: ViewOption[] = [
    { label: 'Lista', value: 'lista', icon: 'pi pi-list' },
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' }
  ];

  tickets = signal<Ticket[]>([
    {
      id: 1,
      titulo: 'Error en login',
      descripcion: 'Los usuarios no pueden iniciar sesión desde la última actualización del sistema',
      estadoActual: 'abierto',
      asignadoA: 'Juan Pérez',
      prioridad: 'alta',
      fechaCreacion: new Date('2026-03-01'),
      fechaLimite: new Date('2026-03-10'),
      comentarios: 'Revisar el servicio de autenticación',
      historialCambios: []
    },
    {
      id: 2,
      titulo: 'Mejora en dashboard',
      descripcion: 'Agregar gráficas de estadísticas para mejorar la visualización de datos',
      estadoActual: 'en_progreso',
      asignadoA: 'María García',
      prioridad: 'media',
      fechaCreacion: new Date('2026-03-03'),
      fechaLimite: new Date('2026-03-15'),
      comentarios: 'Usar Chart.js',
      historialCambios: []
    },
    {
      id: 3,
      titulo: 'Bug en reportes',
      descripcion: 'Los reportes no se generan correctamente y muestran datos erróneos',
      estadoActual: 'resuelto',
      asignadoA: 'Carlos López',
      prioridad: 'critica',
      fechaCreacion: new Date('2026-02-28'),
      fechaLimite: new Date('2026-03-05'),
      comentarios: 'Urgente, afecta a clientes',
      historialCambios: []
    },
    {
      id: 4,
      titulo: 'Actualizar documentación',
      descripcion: 'Documentar nuevas funcionalidades del sistema',
      estadoActual: 'abierto',
      asignadoA: 'Juan Pérez',
      prioridad: 'baja',
      fechaCreacion: new Date('2026-03-05'),
      fechaLimite: new Date('2026-03-20'),
      comentarios: '',
      historialCambios: []
    },
    {
      id: 5,
      titulo: 'Optimizar consultas DB',
      descripcion: 'Las consultas a la base de datos son muy lentas',
      estadoActual: 'en_progreso',
      asignadoA: 'María García',
      prioridad: 'alta',
      fechaCreacion: new Date('2026-03-02'),
      fechaLimite: new Date('2026-03-12'),
      comentarios: 'Agregar índices',
      historialCambios: []
    },
    {
      id: 6,
      titulo: 'Diseño de nueva landing',
      descripcion: 'Rediseñar página principal del sitio',
      estadoActual: 'cerrado',
      asignadoA: 'Carlos López',
      prioridad: 'media',
      fechaCreacion: new Date('2026-02-25'),
      fechaLimite: new Date('2026-03-01'),
      comentarios: 'Completado',
      historialCambios: []
    }
  ]);

  // Columnas Kanban
  columns = signal<KanbanColumn[]>([
    { id: 'col-abierto', titulo: 'Pendiente', estado: 'abierto', tickets: [], icon: 'pi-inbox', color: '#3b82f6' },
    { id: 'col-en-progreso', titulo: 'En Progreso', estado: 'en_progreso', tickets: [], icon: 'pi-clock', color: '#f59e0b' },
    { id: 'col-resuelto', titulo: 'Revisión', estado: 'resuelto', tickets: [], icon: 'pi-check-circle', color: '#22c55e' },
    { id: 'col-cerrado', titulo: 'Hecho', estado: 'cerrado', tickets: [], icon: 'pi-times-circle', color: '#ef4444' }
  ]);

  // Filtros
  searchText = signal<string>('');
  selectedEstado = signal<string | null>(null);
  selectedPrioridad = signal<string | null>(null);
  selectedAsignado = signal<string | null>(null);

  dialogVisible = signal<boolean>(false);
  submitted = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

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

  maxDate = new Date();
  minDate = new Date();

  currentTicket: Ticket = this.emptyTicket();

  constructor(
    private readonly router: Router,
    private readonly permissionService: PermissionService,
    private readonly confirmationService: ConfirmationService
  ) {
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.updateKanbanColumns();
  }

  /**
   * Getters de permisos
   */
  get permissions(): UserPermissions {
    return this.permissionService.getPermissions();
  }

  canCreateTicket(): boolean {
    return this.permissionService.hasPermission('ticketCreate');
  }

  canEditTicket(): boolean {
    return this.permissionService.hasPermission('ticketEdit');
  }

  canDeleteTicket(): boolean {
    return this.permissionService.hasPermission('ticketDelete');
  }

  /**
   * Actualizar columnas Kanban cuando cambian los tickets
   */
  updateKanbanColumns(): void {
    const cols = this.columns();
    cols.forEach(col => {
      col.tickets = this.tickets().filter(t => t.estadoActual === col.estado);
    });
    this.columns.set([...cols]);
  }

  /**
   * Cambio de vista
   */
  onViewChange(): void {
    if (this.currentView() === 'kanban') {
      this.updateKanbanColumns();
    }
  }

  /**
   * Drag & Drop Kanban
   */
  drop(event: CdkDragDrop<Ticket[]>, targetColumn: KanbanColumn): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.previousContainer.data[event.previousIndex];
      const oldState = ticket.estadoActual;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Actualizar estado del ticket
      ticket.estadoActual = targetColumn.estado;

      // Actualizar el ticket en la lista principal
      this.tickets.update(list =>
        list.map(t => t.id === ticket.id ? { ...t, estadoActual: targetColumn.estado } : t)
      );

      this.showSuccess(`Ticket #${ticket.id} movido a "${targetColumn.titulo}"`);
    }

    this.columns.set([...this.columns()]);
  }

  getConnectedLists(): string[] {
    return this.columns().map(col => col.id);
  }

  /**
   * Computed: tickets filtrados
   */
  get filteredTickets(): Ticket[] {
    let result = this.tickets();

    if (this.searchText()) {
      const search = this.searchText().toLowerCase();
      result = result.filter(t =>
        t.titulo.toLowerCase().includes(search) ||
        t.descripcion.toLowerCase().includes(search) ||
        t.id.toString().includes(search)
      );
    }

    if (this.selectedEstado()) {
      result = result.filter(t => t.estadoActual === this.selectedEstado());
    }

    if (this.selectedPrioridad()) {
      result = result.filter(t => t.prioridad === this.selectedPrioridad());
    }

    if (this.selectedAsignado()) {
      result = result.filter(t => t.asignadoA === this.selectedAsignado());
    }

    return result;
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedEstado.set(null);
    this.selectedPrioridad.set(null);
    this.selectedAsignado.set(null);
  }

  hasActiveFilters(): boolean {
    return !!(this.searchText() || this.selectedEstado() || this.selectedPrioridad() || this.selectedAsignado());
  }

  /**
   * Abrir dialog para crear ticket
   */
  openNew(): void {
    if (!this.canCreateTicket()) {
      this.showError('No tienes permiso para crear tickets.');
      return;
    }

    this.currentTicket = this.emptyTicket();
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  /**
   * Guardar ticket nuevo
   */
  saveTicket(): void {
    this.submitted.set(true);

    if (!this.currentTicket.titulo.trim() || !this.currentTicket.descripcion.trim()) {
      this.showError('Completa los campos obligatorios (título y descripción).');
      return;
    }

    const newTicket: Ticket = {
      ...this.currentTicket,
      id: this.nextId(),
      fechaCreacion: new Date()
    };

    this.tickets.update(list => [...list, newTicket]);
    this.updateKanbanColumns();
    this.showSuccess('Ticket creado correctamente.');
    this.dialogVisible.set(false);
    this.submitted.set(false);
  }

  /**
   * Ver detalle del ticket
   */
  viewDetail(ticket: Ticket): void {
    this.router.navigate(['/dashboard/tickets', ticket.id]);
  }

  /**
   * Obtener severidad del estado
   */
  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'abierto': 'info',
      'en_progreso': 'warn',
      'resuelto': 'success',
      'cerrado': 'danger'
    };
    return map[estado] || 'info';
  }

  /**
   * Obtener severidad de la prioridad
   */
  getPrioridadSeverity(prioridad: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'baja': 'success',
      'media': 'info',
      'alta': 'warn',
      'critica': 'danger'
    };
    return map[prioridad] || 'info';
  }

  /**
   * Obtener label del estado
   */
  getEstadoLabel(estado: string): string {
    const found = this.estadosOptions.find(e => e.value === estado);
    return found ? found.label : estado;
  }

  /**
   * Obtener label de la prioridad
   */
  getPrioridadLabel(prioridad: string): string {
    const found = this.prioridadOptions.find(p => p.value === prioridad);
    return found ? found.label : prioridad;
  }

  /**
   * Obtener estadísticas de tickets
   */
  getTicketsPorEstado() {
    const abiertos = this.tickets().filter(t => t.estadoActual === 'abierto').length;
    const enProgreso = this.tickets().filter(t => t.estadoActual === 'en_progreso').length;
    const resueltos = this.tickets().filter(t => t.estadoActual === 'resuelto').length;
    const cerrados = this.tickets().filter(t => t.estadoActual === 'cerrado').length;

    return { abiertos, enProgreso, resueltos, cerrados };
  }

  /**
   * Helpers privados
   */
  private emptyTicket(): Ticket {
    return {
      id: 0,
      titulo: '',
      descripcion: '',
      estadoActual: 'abierto',
      asignadoA: '',
      prioridad: 'media',
      fechaCreacion: new Date(),
      fechaLimite: new Date(),
      comentarios: '',
      historialCambios: []
    };
  }

  private nextId(): number {
    const ids = this.tickets().map(t => t.id);
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
}