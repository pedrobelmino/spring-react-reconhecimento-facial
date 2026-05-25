import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost, getCsrfToken } from './client';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0';
  });

  it('reads CSRF token from cookie', () => {
    document.cookie = 'XSRF-TOKEN=abc123';
    expect(getCsrfToken()).toBe('abc123');
  });

  it('sends credentials and CSRF header on POST', async () => {
    document.cookie = 'XSRF-TOKEN=token-value';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiPost('/api/auth/login', { username: 'admin' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('X-XSRF-TOKEN')).toBe('token-value');
  });

  it('redirects to login on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' }));
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/admin/clientes', assign });

    await expect(apiGet('/api/clientes')).rejects.toThrow('Unauthorized');
    expect(assign).toHaveBeenCalledWith('/login');
  });
});
