export interface UserPermissions {
  // Grupo
  groupAdd: boolean;
  groupEdit: boolean;
  groupDelete: boolean;

  // Ticket
  ticketCreate: boolean;
  ticketEdit: boolean;
  ticketDelete: boolean;

  // Usuario
  userCreate: boolean;
  userEdit: boolean;
  userDelete: boolean;
}

export interface MockUser {
  id: number;
  email: string;
  name: string;
  permissions: UserPermissions;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    email: 'admin@seguridad.com',
    name: 'Admin Sistema',
    permissions: {
      // Grupo
      groupAdd: true,
      groupEdit: true,
      groupDelete: true,
      // Ticket
      ticketCreate: true,
      ticketEdit: true,
      ticketDelete: true,
      // Usuario
      userCreate: true,
      userEdit: true,
      userDelete: true
    }
  },
  {
    id: 2,
    email: 'usuario@seguridad.com',
    name: 'Usuario Demo',
    permissions: {
      // Grupo
      groupAdd: false,
      groupEdit: false,
      groupDelete: false,
      // Ticket
      ticketCreate: true,
      ticketEdit: true,
      ticketDelete: false,
      // Usuario
      userCreate: false,
      userEdit: false,
      userDelete: false
    }
  }
];

// Usuario actualmente autenticado (simulado)
export const CURRENT_USER_EMAIL = 'usuario@seguridad.com';
