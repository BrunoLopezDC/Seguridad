import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';

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
    DatePickerModule
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

  errors = signal<ValidationErrors>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  });

  successMessage = signal<string>('');
  submitted = signal<boolean>(false);

  private readonly SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly PHONE_REGEX = /^[0-9]{10}$/;

  /** Fecha máxima permitida (hace 18 años desde hoy) */
  maxDate = computed<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  });

  constructor(private readonly router: Router) {}

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

  validate(): boolean {
    const newErrors: ValidationErrors = {
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      password: '',
      confirmPassword: ''
    };

    let isValid = true;

    // Nombre
    if (!this.name().trim()) {
      newErrors.name = 'El nombre es obligatorio.';
      isValid = false;
    } else if (this.name().trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres.';
      isValid = false;
    }

    // Email
    if (!this.email().trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
      isValid = false;
    } else if (!this.EMAIL_REGEX.test(this.email())) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
      isValid = false;
    }

    // Teléfono
    if (!this.phone().trim()) {
      newErrors.phone = 'El teléfono es obligatorio.';
      isValid = false;
    } else if (!this.PHONE_REGEX.test(this.phone())) {
      newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos numéricos.';
      isValid = false;
    }

    // Fecha de nacimiento
    if (!this.birthDate()) {
      newErrors.birthDate = 'La fecha de nacimiento es obligatoria.';
      isValid = false;
    } else if (!this.isAdult()) {
      newErrors.birthDate = 'Debes ser mayor de 18 años para registrarte.';
      isValid = false;
    }

    // Contraseña
    if (!this.password()) {
      newErrors.password = 'La contraseña es obligatoria.';
      isValid = false;
    } else if (!this.hasMinLength()) {
      newErrors.password = 'La contraseña debe tener al menos 10 caracteres.';
      isValid = false;
    } else if (!this.hasUpperCase()) {
      newErrors.password = 'La contraseña debe contener al menos una mayúscula.';
      isValid = false;
    } else if (!this.hasLowerCase()) {
      newErrors.password = 'La contraseña debe contener al menos una minúscula.';
      isValid = false;
    } else if (!this.hasNumber()) {
      newErrors.password = 'La contraseña debe contener al menos un número.';
      isValid = false;
    } else if (!this.hasSpecialChar()) {
      newErrors.password = `La contraseña debe contener al menos un símbolo especial: ${this.SPECIAL_CHARS}`;
      isValid = false;
    }

    // Confirmar contraseña
    if (!this.confirmPassword()) {
      newErrors.confirmPassword = 'Confirma tu contraseña.';
      isValid = false;
    } else if (this.password() !== this.confirmPassword()) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
      isValid = false;
    }

    this.errors.set(newErrors);
    return isValid;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.successMessage.set('');

    if (!this.validate()) {
      return;
    }

    console.log('Registro exitoso:', {
      name: this.name(),
      email: this.email(),
      phone: this.phone(),
      birthDate: this.birthDate(),
      password: this.password()
    });

    this.successMessage.set('Cuenta creada exitosamente. Redirigiendo al login...');

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
}