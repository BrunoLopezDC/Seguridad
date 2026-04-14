import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si la petición va al Login o al Register, no le metemos token (es absurdo)
  if (req.url.includes('/login') || req.url.includes('/register')) {
    return next(req);
  }

  // Si tenemos un token guardado, clonamos la petición y le pegamos el Header
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Mandamos la petición modificada hacia el backend
    return next(authReq);
  }

  // Si no hay token (usuario no logueado), la dejamos pasar tal cual. 
  // Tu API Gateway se encargará de rebotarla con un 401 si es una ruta protegida.
  return next(req);
};