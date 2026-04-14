export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  houseHold_id: number;
  role: string;
  allergens: string[];
}
