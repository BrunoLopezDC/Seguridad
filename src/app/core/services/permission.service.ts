import { Injectable, signal, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private authService = inject(AuthService);

  // Señales reactivas con la información REAL del usuario
  public currentUserEmail = signal<string | null>(null);
  public userPermissions = signal<string[]>([]);

  constructor() {
    // El 'effect' se ejecuta automáticamente si 'isLoggedIn' cambia de false a true (o viceversa)
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadPermissionsFromToken();
      } else {
        this.clearPermissions();
      }
    });
  }

  /**
   * Lee el token guardado, lo decodifica y extrae los permisos.
   */
  private loadPermissionsFromToken() {
    const token = this.authService.getToken();
    if (!token) return;

    try {
      // 1. Extraemos la parte central del JWT (el Payload)
      const payloadBase64Url = token.split('.')[1];
      
      // 2. Normalizamos caracteres por si es Base64Url
      const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // 3. Decodificamos el texto y lo convertimos a un objeto JSON
      const payloadDecoded = atob(base64);
      const payloadParams = JSON.parse(payloadDecoded);

      // 4. ¡Asignamos los datos reales extraídos de la base de datos!
      this.currentUserEmail.set(payloadParams.correo);
      this.userPermissions.set(payloadParams.permisos || []);

      // Lo imprimimos en consola solo para que lo veas con tus propios ojos 👀
      console.log('✅ Permisos reales cargados en Angular:', this.userPermissions());
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      this.clearPermissions();
    }
  }

  /**
   * Limpia el rastro cuando el usuario sale.
   */
  private clearPermissions() {
    this.currentUserEmail.set(null);
    this.userPermissions.set([]);
  }

  /**
   * El método estrella. Tus componentes HTML lo usarán así:
   * *ngIf="permissionService.hasPermission('groupEdit')"
   */
  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

// =========================================================
  // ADAPTADORES (Para que los componentes viejos no se rompan)
  // =========================================================

  // Convertimos el arreglo de strings del JWT en el objeto booleano que espera tu UI
  getPermissions(): any {
    const perms = this.userPermissions();
    return {
      groupAdd: perms.includes('groupAdd'),
      groupEdit: perms.includes('groupEdit'),
      groupDelete: perms.includes('groupDelete'),
      ticketCreate: perms.includes('ticketCreate'),
      ticketEdit: perms.includes('ticketEdit'),
      ticketDelete: perms.includes('ticketDelete'),
      userCreate: perms.includes('userCreate'),
      userEdit: perms.includes('userEdit'),
      userDelete: perms.includes('userDelete')
    };
  }

  // Verifica si tiene AL MENOS UNO de los permisos de la lista
  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some(perm => this.hasPermission(perm));
  }

  // Devolvemos un objeto con la propiedad 'email' para que UserProfile no se queje
  getCurrentUser(): any {
    return { email: this.currentUserEmail() };
  }

  // STUBS TEMPORALES para el UserProfileComponent
  getAllUsers(): any[] {
    console.warn('getAllUsers está obsoleto. Falta conectar al backend.');
    return []; 
  }

  // Ajustado a 3 argumentos para que coincida con la llamada de tu componente
  updateUserPermissionByEmail(email: string, permission: string, value: boolean): boolean {
    console.warn('updateUserPermissionByEmail está obsoleto. Falta conectar al backend.');
    return false;
  }
}