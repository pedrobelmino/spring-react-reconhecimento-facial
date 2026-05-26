import { apiGet, apiPost } from './client';

export interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  username: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/login', credentials);
}

export async function logout(): Promise<void> {
  await apiPost<void>('/api/auth/logout');
}

export async function me(): Promise<AdminUser> {
  return apiGet<AdminUser>('/api/auth/me');
}
