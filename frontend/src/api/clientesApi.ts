import { apiGet, apiPatch, apiPost, apiPut } from './client';
import type {
  Cliente,
  ClienteStatus,
  ClienteSummary,
  CreateClienteRequest,
  UpdateClienteRequest,
} from '../types/cliente';

export async function listar(q?: string): Promise<ClienteSummary[]> {
  const path = q ? `/api/clientes?q=${encodeURIComponent(q)}` : '/api/clientes';
  return apiGet<ClienteSummary[]>(path);
}

export async function buscar(id: number): Promise<Cliente> {
  return apiGet<Cliente>(`/api/clientes/${id}`);
}

export async function criar(request: CreateClienteRequest): Promise<Cliente> {
  return apiPost<Cliente>('/api/clientes', request);
}

export async function atualizar(id: number, request: UpdateClienteRequest): Promise<Cliente> {
  return apiPut<Cliente>(`/api/clientes/${id}`, request);
}

export async function alterarStatus(id: number, status: ClienteStatus): Promise<Cliente> {
  return apiPatch<Cliente>(`/api/clientes/${id}/status`, { status });
}
