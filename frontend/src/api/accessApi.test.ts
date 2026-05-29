import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStatus, recognize } from './accessApi';

describe('accessApi', () => {
  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0';
  });

  it('recognize posts imageBase64 to /api/access/recognize', async () => {
    const response = {
      outcome: 'LIBERADO',
      motivo: null,
      clienteId: 42,
      nome: 'João Silva',
      fotoUrl: '/api/clientes/42/foto/1',
      eventoRegistrado: true,
      confianca: 0.92,
      faceCount: 1,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await recognize('data:image/jpeg;base64,abc123');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/access/recognize',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ imageBase64: 'data:image/jpeg;base64,abc123' }),
      }),
    );
    expect(result).toEqual(response);
  });

  it('getStatus fetches /api/access/status', async () => {
    const response = { clientesAtivosComFaces: 5, operacional: true };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getStatus();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/access/status',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
    expect(result).toEqual(response);
  });

  it('recognize throws on non-ok response', async () => {
    document.cookie = 'XSRF-TOKEN=test-token';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid image data',
      }),
    );

    await expect(recognize('bad-data')).rejects.toThrow('Invalid image data');
  });

  it('recognize returns NEGADO response with motivo', async () => {
    const response = {
      outcome: 'NEGADO',
      motivo: 'NAO_RECONHECIDO',
      clienteId: null,
      nome: null,
      fotoUrl: null,
      eventoRegistrado: true,
      confianca: 0,
      faceCount: 1,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => response,
      }),
    );

    const result = await recognize('base64payload');

    expect(result.outcome).toBe('NEGADO');
    expect(result.motivo).toBe('NAO_RECONHECIDO');
    expect(result.faceCount).toBe(1);
  });
});
