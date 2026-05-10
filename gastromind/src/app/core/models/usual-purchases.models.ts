export interface UsualPurchase {
  id: string;
  user_id: string;
  product_id: string;
  target_quantity: number;
}

export interface Product {
  id: string;
  name: string;
}

export interface CreateUsualPurchasePayload {
  user_id: string;
  product_id: string;
  target_quantity: number;
}
