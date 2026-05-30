import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPatch, apiPost, apiPut } from './client';
import { alterarStatus, atualizar, buscar, criar, listar } from './acompanhamentosApi';
import type {
  Acompanhamento,
  AcompanhamentoSummary,
  CreateAcompanhamentoRequest,
  UpdateAcompanhamentoRequest,
} from '../types/acompanhamento';

vi.mock('./client');

const mockSummary: AcompanhamentoSummary = {
  id: 1,
  clienteId: 10,
  clienteNome: 'Maria Silva',
  dataConsulta: '2026-05-20',
  pesoKg: 72.5,
  profissional: 'Dr. Ana',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
};

const mockAcompanhamento: Acompanhamento = {
  id: 1,
  clienteId: 10,
  clienteNome: 'Maria Silva',
  dataConsulta: '2026-05-20',
  pesoKg: 72.5,
  profissional: 'Dr. Ana',
  objetivo: 'Emagrecimento',
  orientacoes: 'Aumentar proteína',
  proximaConsulta: '2026-06-20',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

describe('acompanhamentosApi', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiPut).mockReset();
    vi.mocked(apiPatch).mockReset();
  });

  it('listar calls GET /api/acompanhamentos without filters', async () => {
    vi.mocked(apiGet).mockResolvedValue([mockSummary]);

    const result = await listar();

    expect(apiGet).toHaveBeenCalledWith('/api/acompanhamentos');
    expect(result).toEqual([mockSummary]);
  });

  it('listar calls GET with clienteId and encoded q', async () => {
    vi.mocked(apiGet).mockResolvedValue([mockSummary]);

    await listar({ clienteId: 10, q: 'dr ana' });

    expect(apiGet).toHaveBeenCalledWith('/api/acompanhamentos?clienteId=10&q=dr+ana');
  });

  it('buscar calls GET /api/acompanhamentos/{id}', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockAcompanhamento);

    const result = await buscar(1);

    expect(apiGet).toHaveBeenCalledWith('/api/acompanhamentos/1');
    expect(result).toEqual(mockAcompanhamento);
  });

  it('criar calls POST /api/acompanhamentos with request body', async () => {
    const request: CreateAcompanhamentoRequest = {
      clienteId: 10,
      dataConsulta: '2026-05-20',
      pesoKg: 72.5,
      profissional: 'Dr. Ana',
    };
    vi.mocked(apiPost).mockResolvedValue(mockAcompanhamento);

    const result = await criar(request);

    expect(apiPost).toHaveBeenCalledWith('/api/acompanhamentos', request);
    expect(result).toEqual(mockAcompanhamento);
  });

  it('atualizar calls PUT /api/acompanhamentos/{id} with request body', async () => {
    const request: UpdateAcompanhamentoRequest = {
      dataConsulta: '2026-05-21',
      pesoKg: 71.0,
    };
    vi.mocked(apiPut).mockResolvedValue({ ...mockAcompanhamento, pesoKg: 71.0 });

    const result = await atualizar(1, request);

    expect(apiPut).toHaveBeenCalledWith('/api/acompanhamentos/1', request);
    expect(result.pesoKg).toBe(71.0);
  });

  it('alterarStatus calls PATCH /api/acompanhamentos/{id}/status', async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockAcompanhamento, status: 'INATIVO' });

    const result = await alterarStatus(1, 'INATIVO');

    expect(apiPatch).toHaveBeenCalledWith('/api/acompanhamentos/1/status', { status: 'INATIVO' });
    expect(result.status).toBe('INATIVO');
  });
});
