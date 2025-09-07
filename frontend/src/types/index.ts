export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export type Role = 'superuser' | 'sysadmin' | 'localadmin' | 'user' | 'guest';

export interface Project {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  owner_name?: string;
  status?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  metadata?: Record<string, any>;
  documents?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_used_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateTokenRequest {
  name: string;
  expires_in_hours?: number;
}

export interface AuthResponse {
  user: User;
  session_token: string;
  expires_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

