export interface Fridge {
  id: string;
  household_id: string;
}

export interface CreateFridgePayload {
  household_id: string;
}

export type FridgeItemStatus = 'GOOD' | 'EXPIRING' | 'CONSUMED' | 'EXPIRED';

export interface FridgeItem {
  id: string;
  productId: string;
  fridgeId: string;
  quantity: number;
  expirationDate: string | null;
  status: FridgeItemStatus;
  [key: string]: unknown;
}

export interface CreateFridgeItemPayload {
  productId: string;
  fridgeId: string;
  quantity: number;
  expirationDate: string;
  status: FridgeItemStatus;
}

export const FRIDGE_ITEM_STATUS_LABELS: Record<FridgeItemStatus, string> = {
  GOOD:     'Bueno',
  EXPIRING: 'Por caducar',
  CONSUMED: 'Consumido',
  EXPIRED:  'Caducado',
};

export const ALL_FRIDGE_ITEM_STATUSES: FridgeItemStatus[] = [
  'GOOD', 'EXPIRING', 'CONSUMED', 'EXPIRED',
];
