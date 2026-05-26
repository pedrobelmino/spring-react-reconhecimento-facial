import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import * as authHook from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLayout', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 1, username: 'admin', createdAt: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
    });
    mockLogout.mockResolvedValue(undefined);
  });

  it('renders navbar with Clientes link and Sair button', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /clientes/i })).toHaveAttribute('href', '/admin/clientes');
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('calls logout and navigates to login on Sair click', async () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
