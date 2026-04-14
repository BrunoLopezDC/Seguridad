import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Usamos inject() que es la forma moderna en Angular Standalone
  private http = inject(HttpClient);
  
  // Apuntamos directo al Patovica (API Gateway)
  private readonly API_URL = 'http://localhost:3000/api/users';
  private readonly TOKEN_KEY = 'seguridad_token';

  // Signal reactivo: Angular sabrá al instante si estamos logueados o no
  public isLoggedIn = signal<boolean>(!!this.getToken());

  constructor() {}

  /**
   * Envía las credenciales al backend y guarda el token si hay éxito.
   */
  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<{ access_token: string }>(`${this.API_URL}/login`, { correo, contrasena }).pipe(
      tap(response => {
        if (response && response.access_token) {
          this.saveToken(response.access_token);
          this.isLoggedIn.set(true); // Cambiamos el estado global
        }
      })
    );
  }

  /**
   * Registra un nuevo usuario en el sistema.
   */
  register(nombre: string, correo: string, contrasena: string): Observable<any> {
    // El Gateway redirigirá esto al ms-users (puerto 3001)
    return this.http.post(`${this.API_URL}/register`, { 
      nombre, 
      correo, 
      contrasena,
      idRol: 2 // Por defecto le asignamos el rol de 'Usuario' (ajusta el ID según tu DB)
    });
  }

  /**
   * Cierra la sesión borrando el token del navegador.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
  }

  /**
   * Recupera el token guardado en el LocalStorage.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guarda el token de forma segura.
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}