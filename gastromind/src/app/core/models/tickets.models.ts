export type VerificationStatus = 'OK' | 'PENDING_REVIEW';

export interface TicketItem {
  id: string;
  product_id: string;
  product_name: string;
  product_needs_review: boolean;
  product_review_note: string | null;
  quantity: number;
  unit_id: string;
  unit_name: string;
  unit_code: string;
  price_unit: number;
  verification_status: VerificationStatus;
  line_note: string | null;
}

export interface Ticket {
  id: string;
  household_id: string;
  uploaded_by_user_id: string;
  user_id: string;
  store_id: string;
  total_amount: number;
  purchaseDate: string;
  items: TicketItem[];
  pending_store: unknown | null;
}

export interface CreateTicketItemPayload {
  product_id: string;
  line_product_name: string;
  quantity: number;
  price_unit: number;
  unit_id: string;
  verification_status: VerificationStatus;
  line_note: string | null;
}

export interface CreateTicketPayload {
  user_id: string;
  store_id: string;
  total_mount: number;        // API usa total_mount (no total_amount)
  purchaseDate: string;
  items: CreateTicketItemPayload[];
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  OK:             'OK',
  PENDING_REVIEW: 'Pendiente revisión',
};

export interface Store {
  id: string;
  name: string;
  name_norm: string;
}

export type ItemSortField = 'quantity' | 'price_unit';
export type SortDir       = 'asc' | 'desc';
