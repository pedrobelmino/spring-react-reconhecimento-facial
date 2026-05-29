import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost, ensureCsrfToken, getCsrfToken } from './client';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0';
  });

  it('reads CSRF token from cookie', () => {
    document.cookie = 'XSRF-TOKEN=abc123';
    expect(getCsrfToken()).toBe('abc123');
  });

  it('refreshes CSRF token before authenticated POST', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/auth/csrf') {
        document.cookie = 'XSRF-TOKEN=token-value';
        return {
          ok: true,
          status: 200,
          json: async () => ({ headerName: 'X-XSRF-TOKEN', token: 'token-value' }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ valid: true }),
        init,
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiPost('/api/faces/validate', { imageBase64: 'abc' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/auth/csrf',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/faces/validate',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    const headers = fetchMock.mock.calls[1][1]?.headers as Headers;
    expect(headers.get('X-XSRF-TOKEN')).toBe('token-value');
  });

  it('does not refresh CSRF before login POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ username: 'admin' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiPost('/api/auth/login', { username: 'admin', password: 'admin123' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('ensureCsrfToken is a no-op when cookie already exists', async () => {
    document.cookie = 'XSRF-TOKEN=existing';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await ensureCsrfToken();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to login on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' }));
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/admin/clientes', assign });

    await expect(apiGet('/api/clientes')).rejects.toThrow('Unauthorized');
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('does not redirect to login on 401 when on entrada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' }));
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/entrada', assign });

    await expect(apiGet('/api/auth/me')).rejects.toThrow('Unauthorized');
    expect(assign).not.toHaveBeenCalled();
  });
});
