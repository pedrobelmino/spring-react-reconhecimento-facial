import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as authHook from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/clientes" element={<div>Clientes</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  it('renders username and password fields with submit button', () => {
    renderLogin();

    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
  });

  it('calls login with form values on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLogin();

    fireEvent.change(screen.getByLabelText(/usuário/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/clientes', { replace: true });
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Unauthorized'));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/usuário/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/credenciais inválidas/i);
    });
  });

  it('redirects to clientes when already authenticated', () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: { id: 1, username: 'admin', createdAt: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
      loading: false,
      login: mockLogin,
      logout: vi.fn(),
    });

    renderLogin();

    expect(mockNavigate).toHaveBeenCalledWith('/admin/clientes', { replace: true });
  });
});
