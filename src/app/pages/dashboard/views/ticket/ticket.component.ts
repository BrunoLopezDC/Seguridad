import { Component, signal, OnInit, inject } from '@angular/core';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmationService } from 'primeng/api';
import { PermissionService } from '../../../../core/services/permission.service';
import { TicketService } from '../../../../core/services/ticket.service';
import { UserService } from '../../../../core/services/user.service';

interface SelectOption {
  label: string;
  value: any;
}

interface KanbanColumn {
  id: string;
  titulo: string;
  estado: string;
  tickets: any[];
  icon: string;
  color: string;
}

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [
    FormsModule, DatePipe, SlicePipe, NgClass, DragDropModule, CardModule,
    InputTextModule, Textarea, FloatLabelModule, ButtonModule, TableModule,
    DialogModule, MessageModule, TagModule, TooltipModule, SelectModule,
    DatePickerModule, ToggleSwitchModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.css'
})
export class TicketComponent implements OnInit {

  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  isKanban = signal<boolean>(false);
  tickets = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  columns = signal<KanbanColumn[]>([
    { id: 'col-abierto', titulo: 'Pendiente', estado: 'abierto', tickets: [], icon: 'pi-inbox', color: '#3b82f6' },
    { id: 'col-en-progreso', titulo: 'En Progreso', estado: 'en_progreso', tickets: [], icon: 'pi-clock', color: '#f59e0b' },
    { id: 'col-resuelto', titulo: 'Revisión', estado: 'resuelto', tickets: [], icon: 'pi-check-circle', color: '#22c55e' },
    { id: 'col-cerrado', titulo: 'Hecho', estado: 'cerrado', tickets: [], icon: 'pi-times-circle', color: '#ef4444' }
  ]);

  searchText = signal<string>('');
  selectedEstado = signal<string | null>(null);
  selectedPrioridad = signal<string | null>(null);
  selectedAsignado = signal<any | null>(null);

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

  // Se mantiene como array plano para no romper el HTML
  usuariosOptions: SelectOption[] = [];

  maxDate = new Date();
  minDate = new Date();
  currentTicket: any = this.emptyTicket();

  constructor(
    private readonly router: Router,
    private readonly permissionService: PermissionService,
    private readonly confirmationService: ConfirmationService
  ) {
    this.minDate.setDate(this.minDate.getDate() + 1);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.updateKanbanColumns();
        this.isLoading.set(false);
      },
      error: () => {
        this.showError('Error al cargar tickets.');
        this.isLoading.set(false);
      }
    });

    this.userService.getUsers().subscribe(users => {
  const options = users.map(u => ({ 
    label: u.nombreCompleto, 
    value: u.idUsuario 
  }));

  // En lugar de asignar directo, lo envolvemos en un setTimeout
  // Esto evita el error NG0100 sin cambiar el tipo de variable ni el HTML
  setTimeout(() => {
    this.usuariosOptions = options;
  }, 0);
});
  }

  get permissions() { return this.permissionService.getPermissions(); }
  canCreateTicket() { return this.permissionService.hasPermission('ticketCreate'); }
  canEditTicket() { return this.permissionService.hasPermission('ticketEdit'); }
  canDeleteTicket() { return this.permissionService.hasPermission('ticketDelete'); }

  updateKanbanColumns(): void {
    const cols = this.columns();
    cols.forEach(col => {
      col.tickets = this.tickets().filter(t => t.estadoActual === col.estado);
    });
    this.columns.set([...cols]);
  }

  onViewChange(): void {
    if (this.isKanban()) this.updateKanbanColumns();
  }

  setKanbanView(value: boolean): void {
    this.isKanban.set(value);
    this.onViewChange();
  }

  drop(event: CdkDragDrop<any[]>, targetColumn: KanbanColumn): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const ticket = event.previousContainer.data[event.previousIndex];
      this.ticketService.updateTicket(ticket.idTicket, { estadoActual: targetColumn.estado }).subscribe({
        next: () => {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          ticket.estadoActual = targetColumn.estado;
          this.tickets.set([...this.tickets()]); // Notificar cambio a signals
          this.showSuccess(`Ticket #${ticket.idTicket} movido a "${targetColumn.titulo}"`);
        },
        error: () => this.showError('No se pudo actualizar el estado.')
      });
    }
  }

  getConnectedLists(): string[] { return this.columns().map(col => col.id); }

  get filteredTickets(): any[] {
    let result = this.tickets();
    if (this.searchText()) {
      const search = this.searchText().toLowerCase();
      result = result.filter(t => 
        t.titulo.toLowerCase().includes(search) || 
        t.idTicket.toString().includes(search)
      );
    }
    if (this.selectedEstado()) result = result.filter(t => t.estadoActual === this.selectedEstado());
    if (this.selectedPrioridad()) result = result.filter(t => t.prioridad === this.selectedPrioridad());
    if (this.selectedAsignado()) result = result.filter(t => t.idUsuarioAsignado === this.selectedAsignado());
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

  openNew(): void {
    if (!this.canCreateTicket()) return;
    this.currentTicket = this.emptyTicket();
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  saveTicket(): void {
    this.submitted.set(true);
    if (!this.currentTicket.titulo.trim() || !this.currentTicket.descripcion.trim()) return;

    const dataToSend = {
      ...this.currentTicket,
      // Mapeamos el campo del formulario al que espera el MS
      idUsuarioAsignado: this.currentTicket.idUsuarioAsignado
    };

    this.ticketService.createTicket(dataToSend).subscribe({
      next: () => {
        this.showSuccess('Ticket creado correctamente.');
        this.loadData();
        this.dialogVisible.set(false);
      },
      error: () => this.showError('Error al guardar el ticket.')
    });
  }

  viewDetail(ticket: any): void {
    this.router.navigate(['/dashboard/tickets', ticket.idTicket]);
  }

  getEstadoSeverity(estado: string): any {
    const map: any = { 'abierto': 'info', 'en_progreso': 'warn', 'resuelto': 'success', 'cerrado': 'danger' };
    return map[estado] || 'info';
  }

  getPrioridadSeverity(prioridad: string): any {
    const map: any = { 'baja': 'success', 'media': 'info', 'alta': 'warn', 'critica': 'danger' };
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

  getTicketsPorEstado() {
    const t = this.tickets();
    return {
      abiertos: t.filter(x => x.estadoActual === 'abierto').length,
      enProgreso: t.filter(x => x.estadoActual === 'en_progreso').length,
      resueltos: t.filter(x => x.estadoActual === 'resuelto').length,
      cerrados: t.filter(x => x.estadoActual === 'cerrado').length
    };
  }

  private emptyTicket() {
    return { titulo: '', descripcion: '', estadoActual: 'abierto', idUsuarioAsignado: null, prioridad: 'media', fechaLimite: null };
  }

  private showSuccess(msg: string) { this.successMessage.set(msg); setTimeout(() => this.successMessage.set(''), 3000); }
  private showError(msg: string) { this.errorMessage.set(msg); setTimeout(() => this.errorMessage.set(''), 3000); }
}