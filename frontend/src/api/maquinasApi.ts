import { apiGet, apiPatch, apiPost, apiPut } from './client';
import type {
  CreateMaquinaRequest,
  Maquina,
  MaquinaStatus,
  MaquinaSummary,
  UpdateMaquinaRequest,
} from '../types/maquina';

export async function listar(q?: string): Promise<MaquinaSummary[]> {
  const path = q ? `/api/maquinas?q=${encodeURIComponent(q)}` : '/api/maquinas';
  return apiGet<MaquinaSummary[]>(path);
}

export async function buscar(id: number): Promise<Maquina> {
  return apiGet<Maquina>(`/api/maquinas/${id}`);
}

export async function criar(request: CreateMaquinaRequest): Promise<Maquina> {
  return apiPost<Maquina>('/api/maquinas', request);
}

export async function atualizar(id: number, request: UpdateMaquinaRequest): Promise<Maquina> {
  return apiPut<Maquina>(`/api/maquinas/${id}`, request);
}

export async function alterarStatus(id: number, status: MaquinaStatus): Promise<Maquina> {
  return apiPatch<Maquina>(`/api/maquinas/${id}/status`, { status });
}
