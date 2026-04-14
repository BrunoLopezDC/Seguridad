import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interfaz que refleja el resultado del Join en tu ms-tickets
 */
export interface Ticket {
  idTicket: number;
  titulo: string;
  descripcion: string;
  estadoActual: string;
  prioridad: string;
  idUsuarioAsignado: number | null;
  asignadoA: string; // El nombreCompleto que devuelve tu AppService
  fechaLimite: string | Date | null;
  comentarios?: string;
  fechaCreacion: string | Date;
  fechaActualizacion: string | Date;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  
  // Apuntamos al Gateway (Puerto 3000)
  private readonly API_URL = 'http://localhost:3000/api/tickets';

  /**
   * Obtiene todos los tickets (ya hidratados con el nombre del usuario asignado)
   */
  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.API_URL);
  }

  getTicketById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  /**
   * Crea un nuevo ticket
   */
  createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.post<Ticket>(this.API_URL, ticket);
  }

  /**
   * Actualiza un ticket existente (Estado, prioridad, etc)
   */
  updateTicket(id: number, data: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.API_URL}/${id}`, data);
  }

  /**
   * Elimina un ticket del sistema
   */
  deleteTicket(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.API_URL}/${id}`);
  }
}