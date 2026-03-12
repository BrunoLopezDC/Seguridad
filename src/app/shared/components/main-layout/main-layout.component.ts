import { Component, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    MenuModule,
    TooltipModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  @ViewChild('versionMenu') versionMenu!: Menu;

  collapsed = signal<boolean>(false);

  // TODO: al integrar backend, obtener del servicio de auth
  currentUser = signal<string>('usuario@seguridad.com');

  navItems = [
    { label: 'Usuarios', icon: 'pi pi-users',   route: '/dashboard/user' },
    { label: 'Grupos',   icon: 'pi pi-sitemap', route: '/dashboard/group' },
    { label: 'Tickets',  icon: 'pi pi-ticket',  route: '/dashboard/tickets' },

  ];

  versionMenuItems: MenuItem[] = [
    {
      label: 'Versión 1.0.0',
      icon: 'pi pi-tag',
      disabled: true
    },
    { separator: true },
    {
      label: 'Notas de versión',
      icon: 'pi pi-file'
    },
    {
      label: 'Buscar actualizaciones',
      icon: 'pi pi-refresh'
    }
  ];

  constructor(private readonly router: Router) {}

  toggleSidebar(): void {
    this.collapsed.update(v => !v);
  }

  toggleVersionMenu(event: MouseEvent): void {
    this.versionMenu.toggle(event);
  }

  logout(): void {
    // TODO: al integrar backend, limpiar sesión aquí
    this.router.navigate(['/login']);
  }
}