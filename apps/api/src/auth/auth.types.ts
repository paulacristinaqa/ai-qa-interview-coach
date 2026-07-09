export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  locale: "pt-BR" | "en";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

