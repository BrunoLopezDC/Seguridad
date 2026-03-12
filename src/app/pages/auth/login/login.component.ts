import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PermissionService } from '../../../core/services/permission.service';

interface Credentials {
  email: string;
  password: string;
  role: 'admin' | 'user';
}

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    FloatLabelModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = signal<string>('');
  password = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  submitted = signal<boolean>(false);

  private readonly VALID_CREDENTIALS: Credentials[] = [
    { email: 'admin@seguridad.com', password: 'Admin@12345', role: 'admin' },
    { email: 'usuario@seguridad.com', password: 'User@12345!', role: 'user' }
  ];

  constructor(
    private readonly router: Router,
    private readonly permissionService: PermissionService
  ) {}

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    const found = this.VALID_CREDENTIALS.find(
      cred => cred.email === this.email().trim() && cred.password === this.password()
    );

    if (!found) {
      this.errorMessage.set('Credenciales incorrectas. Intenta de nuevo.');
      return;
    }

    // ✅ ACTUALIZAR el usuario actual en PermissionService
    this.permissionService.setCurrentUser(found.email);

    this.successMessage.set('Inicio de sesión exitoso. Redirigiendo...');

    // TODO: reemplazar con servicio de auth al integrar backend
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}