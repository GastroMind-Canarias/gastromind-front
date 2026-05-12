export interface Product {
  id: string;
  name: string;
  is_essential: boolean;
  needs_review: boolean;
  review_note: string | null;
  allergen_id: string | null;
}

export interface CreateProductPayload {
  name: string;
  is_essential: boolean;
  needs_review: boolean;
  review_note: string | null;
  allergen_id: string | null;
}
