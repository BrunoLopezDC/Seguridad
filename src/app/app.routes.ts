import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: '',
        redirectTo: 'tickets',
        pathMatch: 'full'
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./pages/dashboard/views/ticket/ticket.component').then(m => m.TicketComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./pages/dashboard/views/ticket/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent)
      },
      {
        path: 'user',
        loadComponent: () =>
          import('./pages/dashboard/views/user/user.component').then(m => m.UserComponent)
      },
      {
        path: 'user/:id',
        loadComponent: () =>
          import('./pages/dashboard/views/user/user-profile/user-profile').then(m => m.UserProfileComponent)
      },
      {
        path: 'group',
        loadComponent: () =>
          import('./pages/dashboard/views/group/group.component').then(m => m.GroupComponent)
      },
      {
        path: 'group/:id',
        loadComponent: () =>
          import('./pages/dashboard/views/group/group-detail/group-detail').then(m => m.GroupDetailComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];