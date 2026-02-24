import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

interface Credentials {
  email: string;
  password: string;
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

  /** Credenciales hardcodeadas */
  private readonly VALID_CREDENTIALS: Credentials[] = [
    { email: 'admin@seguridad.com', password: 'Admin@12345' },
    { email: 'usuario@seguridad.com', password: 'User@12345!' }
  ];

  constructor(private readonly router: Router) {}

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validar campos vacíos
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    // Validar credenciales
    const isValid = this.VALID_CREDENTIALS.some(
      cred => cred.email === this.email().trim() && cred.password === this.password()
    );

    if (!isValid) {
      this.errorMessage.set('Credenciales incorrectas. Intenta de nuevo.');
      return;
    }

    this.successMessage.set('Inicio de sesión exitoso. Bienvenido!');
    console.log('Login exitoso:', this.email());
  }
}