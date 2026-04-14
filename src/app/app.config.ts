import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

// 1. Importamos withInterceptors y nuestro nuevo archivo
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    
    // 2. Encendemos el HttpClient y le metemos el espía en la mochila
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};