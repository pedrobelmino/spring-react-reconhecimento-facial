import { createElement } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './useAuth';
import * as authApi from '../api/authApi';

vi.mock('../api/authApi');

const mockUser = {
  id: 1,
  username: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
};

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.mocked(authApi.me).mockRejectedValue(new Error('Unauthorized'));
    vi.mocked(authApi.login).mockResolvedValue({ username: 'admin' });
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
  });

  it('starts loading and resolves unauthenticated when me fails', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user when me succeeds on mount', async () => {
    vi.mocked(authApi.me).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login calls api and sets user', async () => {
    vi.mocked(authApi.me)
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('admin', 'admin123');
    });

    expect(authApi.login).toHaveBeenCalledWith({ username: 'admin', password: 'admin123' });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears user', async () => {
    vi.mocked(authApi.me).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });
});
