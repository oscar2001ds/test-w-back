export interface JwtPayload {
  sub: number; // User ID
  username: string;
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    role: string;
  };
  tokens: AuthTokens;
}