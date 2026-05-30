import { apiGet, apiPatch, apiPost, apiPut } from './client';
import type {
  Acompanhamento,
  AcompanhamentoStatus,
  AcompanhamentoSummary,
  CreateAcompanhamentoRequest,
  ListarAcompanhamentosParams,
  UpdateAcompanhamentoRequest,
} from '../types/acompanhamento';

function buildListPath(params?: ListarAcompanhamentosParams): string {
  if (!params?.clienteId && !params?.q) {
    return '/api/acompanhamentos';
  }
  const searchParams = new URLSearchParams();
  if (params.clienteId != null) {
    searchParams.set('clienteId', String(params.clienteId));
  }
  if (params.q) {
    searchParams.set('q', params.q);
  }
  return `/api/acompanhamentos?${searchParams.toString()}`;
}

export async function listar(params?: ListarAcompanhamentosParams): Promise<AcompanhamentoSummary[]> {
  return apiGet<AcompanhamentoSummary[]>(buildListPath(params));
}

export async function buscar(id: number): Promise<Acompanhamento> {
  return apiGet<Acompanhamento>(`/api/acompanhamentos/${id}`);
}

export async function criar(request: CreateAcompanhamentoRequest): Promise<Acompanhamento> {
  return apiPost<Acompanhamento>('/api/acompanhamentos', request);
}

export async function atualizar(id: number, request: UpdateAcompanhamentoRequest): Promise<Acompanhamento> {
  return apiPut<Acompanhamento>(`/api/acompanhamentos/${id}`, request);
}

export async function alterarStatus(id: number, status: AcompanhamentoStatus): Promise<Acompanhamento> {
  return apiPatch<Acompanhamento>(`/api/acompanhamentos/${id}/status`, { status });
}
