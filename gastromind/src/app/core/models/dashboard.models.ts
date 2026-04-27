/**
 * Modelos que reflejan las respuestas de la API REST.
 * Si la API devuelve paginación (p. ej. { content: [], totalElements: n }),
 * ajustar las interfaces PaginatedResponse<T> según corresponda.
 */

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  houseHold_id: number;
  allergens: string[];
}

export interface Household {
  id: number;
  name: string;
  members?: number[];
}

export interface Ticket {
  id: number;
  title?: string;
  status?: string;
  createdAt?: string;
}

/** Shape usada por el DashboardComponent para mostrar los KPIs. */
export interface DashboardStats {
  totalUsers: number;
  totalHouseholds: number;
  totalTickets: number;
}
