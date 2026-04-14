import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService } from '../../../core/services/auth.service';

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
  isLoading = signal<boolean>(false);

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService 
  ) {}

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.email().trim(), this.password()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Inicio de sesión exitoso. Redirigiendo...');
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Credenciales incorrectas. Intenta de nuevo.');
        } else {
          this.errorMessage.set('Error de conexión con el servidor.');
        }
      }
    });
  }
}