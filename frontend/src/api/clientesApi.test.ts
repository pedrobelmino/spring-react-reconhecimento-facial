import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPatch, apiPost, apiPut } from './client';
import { alterarStatus, atualizar, criar, listar } from './clientesApi';
import type { Cliente, ClienteSummary, CreateClienteRequest, UpdateClienteRequest } from '../types/cliente';

vi.mock('./client');

const mockSummary: ClienteSummary = {
  id: 1,
  nome: 'Maria Silva',
  cpfMascarado: '***.982.247-**',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
};

const mockCliente: Cliente = {
  id: 1,
  nome: 'Maria Silva',
  cpf: '12345678901',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
  fotoUrls: ['/api/clientes/1/foto/1', '/api/clientes/1/foto/2'],
};

describe('clientesApi', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiPut).mockReset();
    vi.mocked(apiPatch).mockReset();
  });

  it('listar calls GET /api/clientes without query', async () => {
    vi.mocked(apiGet).mockResolvedValue([mockSummary]);

    const result = await listar();

    expect(apiGet).toHaveBeenCalledWith('/api/clientes');
    expect(result).toEqual([mockSummary]);
  });

  it('listar calls GET /api/clientes with encoded query', async () => {
    vi.mocked(apiGet).mockResolvedValue([mockSummary]);

    await listar('maria silva');

    expect(apiGet).toHaveBeenCalledWith('/api/clientes?q=maria%20silva');
  });

  it('criar calls POST /api/clientes with request body', async () => {
    const request: CreateClienteRequest = {
      nome: 'Maria Silva',
      cpf: '12345678901',
      photosBase64: ['photo1', 'photo2'],
    };
    vi.mocked(apiPost).mockResolvedValue(mockCliente);

    const result = await criar(request);

    expect(apiPost).toHaveBeenCalledWith('/api/clientes', request);
    expect(result).toEqual(mockCliente);
  });

  it('atualizar calls PUT /api/clientes/{id} with request body', async () => {
    const request: UpdateClienteRequest = {
      nome: 'Maria Santos',
      cpf: '12345678901',
    };
    vi.mocked(apiPut).mockResolvedValue({ ...mockCliente, nome: 'Maria Santos' });

    const result = await atualizar(1, request);

    expect(apiPut).toHaveBeenCalledWith('/api/clientes/1', request);
    expect(result.nome).toBe('Maria Santos');
  });

  it('alterarStatus calls PATCH /api/clientes/{id}/status', async () => {
    vi.mocked(apiPatch).mockResolvedValue({ ...mockCliente, status: 'INATIVO' });

    const result = await alterarStatus(1, 'INATIVO');

    expect(apiPatch).toHaveBeenCalledWith('/api/clientes/1/status', { status: 'INATIVO' });
    expect(result.status).toBe('INATIVO');
  });
});
