export interface Allergen {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  houseHold_id: string;
  role: string;
  allergens: Allergen[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
}
