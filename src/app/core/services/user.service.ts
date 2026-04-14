import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/users';

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  // NUEVO: Obtener perfil completo
  getUserProfile(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  // NUEVO: Modificar permisos
  toggleUserPermission(userId: number, permiso: string, habilitado: boolean): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/${userId}/permissions`, { permiso, habilitado });
  }
}