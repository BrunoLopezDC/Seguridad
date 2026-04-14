import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth.service'; // <-- 1. Importamos el servicio

interface ValidationErrors {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    DatePickerModule,
    PasswordModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name = signal<string>('');
  email = signal<string>('');
  phone = signal<string>('');
  birthDate = signal<Date | null>(null);
  password = signal<string>('');
  confirmPassword = signal<string>('');

  passwordValue: string = '';
  confirmPasswordValue: string = '';
  birthDateValue: Date | null = null; 

  errors = signal<ValidationErrors>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  });

  successMessage = signal<string>('');
  globalError = signal<string>(''); // <-- 2. Para mostrar errores del backend (ej. "Correo ya existe")
  submitted = signal<boolean>(false);
  isLoading = signal<boolean>(false); // <-- 3. Para bloquear el botón mientras guarda

  private readonly SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly PHONE_REGEX = /^[0-9]{10}$/;

  maxDate: Date = (() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  })();

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService // <-- 4. Inyectamos el servicio
  ) {}

  isAdult = computed<boolean>(() => {
    const birth = this.birthDate();
    if (!birth) return false;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 18;
  });

  hasSpecialChar = computed<boolean>(() => {
    return [...this.password()].some(char => this.SPECIAL_CHARS.includes(char));
  });

  hasUpperCase = computed<boolean>(() => {
    return /[A-Z]/.test(this.password());
  });

  hasLowerCase = computed<boolean>(() => {
    return /[a-z]/.test(this.password());
  });

  hasNumber = computed<boolean>(() => {
    return /[0-9]/.test(this.password());
  });

  hasMinLength = computed<boolean>(() => {
    return this.password().length >= 10;
  });

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/[^0-9]/g, '');
    this.phone.set(cleaned);
    input.value = cleaned;
  }

  onPasswordChange(value: string): void {
    this.passwordValue = value;
    this.password.set(value);
  }

  onConfirmPasswordChange(value: string): void {
    this.confirmPasswordValue = value;
    this.confirmPassword.set(value);
  }

  onDateChange(value: Date | null): void {
    this.birthDateValue = value;        
    this.birthDate.set(value);          
  }

  validate(): boolean {
    const newErrors: ValidationErrors = {
      name: '', email: '', phone: '', birthDate: '', password: '', confirmPassword: ''
    };
    let isValid = true;

    if (!this.name().trim()) { newErrors.name = 'El nombre es obligatorio.'; isValid = false; } 
    else if (this.name().trim().length < 3) { newErrors.name = 'El nombre debe tener al menos 3 caracteres.'; isValid = false; }

    if (!this.email().trim()) { newErrors.email = 'El correo electrónico es obligatorio.'; isValid = false; } 
    else if (!this.EMAIL_REGEX.test(this.email())) { newErrors.email = 'Ingresa un correo electrónico válido.'; isValid = false; }

    if (!this.phone().trim()) { newErrors.phone = 'El teléfono es obligatorio.'; isValid = false; } 
    else if (!this.PHONE_REGEX.test(this.phone())) { newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos numéricos.'; isValid = false; }

    if (!this.birthDate()) { newErrors.birthDate = 'La fecha de nacimiento es obligatoria.'; isValid = false; } 
    else if (!this.isAdult()) { newErrors.birthDate = 'Debes ser mayor de 18 años para registrarte.'; isValid = false; }

    if (!this.password()) { newErrors.password = 'La contraseña es obligatoria.'; isValid = false; } 
    else if (!this.hasMinLength()) { newErrors.password = 'La contraseña debe tener al menos 10 caracteres.'; isValid = false; } 
    else if (!this.hasUpperCase()) { newErrors.password = 'La contraseña debe contener al menos una mayúscula.'; isValid = false; } 
    else if (!this.hasLowerCase()) { newErrors.password = 'La contraseña debe contener al menos una minúscula.'; isValid = false; } 
    else if (!this.hasNumber()) { newErrors.password = 'La contraseña debe contener al menos un número.'; isValid = false; } 
    else if (!this.hasSpecialChar()) { newErrors.password = `La contraseña debe contener al menos un símbolo especial: ${this.SPECIAL_CHARS}`; isValid = false; }

    if (!this.confirmPassword()) { newErrors.confirmPassword = 'Confirma tu contraseña.'; isValid = false; } 
    else if (this.password() !== this.confirmPassword()) { newErrors.confirmPassword = 'Las contraseñas no coinciden.'; isValid = false; }

    this.errors.set(newErrors);
    return isValid;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.successMessage.set('');
    this.globalError.set('');

    if (!this.validate()) return;

    this.isLoading.set(true);

    // 5. Llamada REAL al backend para registrar al usuario
    this.authService.register(this.name().trim(), this.email().trim(), this.password()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Cuenta creada exitosamente. Redirigiendo al login...');
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Atrapamos el error si el correo ya existe en la base de datos
        if (err.status === 400 && err.error?.message) {
          this.globalError.set(err.error.message);
        } else {
          this.globalError.set('Ocurrió un error al intentar crear la cuenta. Intenta más tarde.');
        }
      }
    });
  }
}