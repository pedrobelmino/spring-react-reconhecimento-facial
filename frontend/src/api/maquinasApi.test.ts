import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPatch, apiPost, apiPut } from './client';
import { alterarStatus, atualizar, criar, listar } from './maquinasApi';
import type {
  CreateMaquinaRequest,
  Maquina,
  MaquinaSummary,
  UpdateMaquinaRequest,
} from '../types/maquina';

vi.mock('./client');

const mockSummary: MaquinaSummary = {
  id: 1,
  nome: 'Esteira 01',
  tipo: 'CARDIO',
  status: 'ATIVA',
  localizacao: 'Sala cardio',
  createdAt: '2026-05-25T10:00:00Z',
};

const mockMaquina: Maquina = {
  id: 1,
  nome: 'Esteira 01',
  tipo: 'CARDIO',
  marca: 'Technogym',
  modelo: 'Run 500',
  codigoPatrimonio: 'PAT-001',
  localizacao: 'Sala cardio',
  status: 'ATIVA',
  observacoes: null,
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

describe('maquinasApi', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiPut).mockReset();
    vi.mocked(apiPatch).mockReset();
  });

  it('listar calls GET /api/maquinas without query', async () => {
    vi.mocked(apiGet).mockResolvedValue([mockSummary]);

    const result = await listar();

    expect(apiGet).toHaveBeenCalledWith('/api/maquinas');
    expect(result).toEqual([mockSummary]);
  });

  it('listar calls GET /api/maquinas with encoded query', async () => {
    vi.mocked(apiGet).mockResolvedValue([mockSummary]);

    await listar('esteira 01');

    expect(apiGet).toHaveBeenCalledWith('/api/maquinas?q=esteira%2001');
  });

  it('criar calls POST /api/maquinas with request body', async () => {
    const request: CreateMaquinaRequest = {
      nome: 'Esteira 01',
      tipo: 'CARDIO',
      marca: 'Technogym',
      codigoPatrimonio: 'PAT-001',
    };
    vi.mocked(apiPost).mockResolvedValue(mockMaquina);

    const result = await criar(request);

    expect(apiPost).toHaveBeenCalledWith('/api/maquinas', request);
    expect(result).toEqual(mockMaquina);
  });

  it('atualizar calls PUT /api/maquinas/{id} with request body', async () => {
    const request: UpdateMaquinaRequest = {
      nome: 'Esteira 02',
      tipo: 'CARDIO',
    };
    vi.mocked(apiPut).mockResolvedValue({ ...mockMaquina, nome: 'Esteira 02' });

    const result = await atualizar(1, request);

    expect(apiPut).toHaveBeenCalledWith('/api/maquinas/1', request);
    expect(result.nome).toBe('Esteira 02');
  });

  it('alterarStatus calls PATCH /api/maquinas/{id}/status', async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockMaquina, status: 'MANUTENCAO' });

    const result = await alterarStatus(1, 'MANUTENCAO');

    expect(apiPatch).toHaveBeenCalledWith('/api/maquinas/1/status', { status: 'MANUTENCAO' });
    expect(result.status).toBe('MANUTENCAO');
  });
});
