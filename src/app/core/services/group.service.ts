import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
  
  // Apuntamos al Gateway, el cual redirigirá al ms-groups (puerto 3002)
  private readonly API_URL = 'http://localhost:3000/api/groups';

  getGroups(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  getGroupById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  createGroup(nombre: string, descripcion: string): Observable<any> {
    return this.http.post<any>(this.API_URL, { nombre, descripcion });
  }

  updateGroup(id: number, nombre: string, descripcion: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, { nombre, descripcion });
  }

  deleteGroup(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}