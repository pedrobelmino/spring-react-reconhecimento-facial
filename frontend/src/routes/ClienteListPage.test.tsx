import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClienteListPage from './ClienteListPage';
import * as clientesApi from '../api/clientesApi';
import type { ClienteSummary } from '../types/cliente';

vi.mock('../api/clientesApi');

const clienteAtivo: ClienteSummary = {
  id: 1,
  nome: 'Ana Costa',
  cpfMascarado: '***.123.456-**',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
};

const clienteInativo: ClienteSummary = {
  id: 2,
  nome: 'Bruno Lima',
  cpfMascarado: '***.987.654-**',
  status: 'INATIVO',
  createdAt: '2026-05-20T08:00:00Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ClienteListPage />
    </MemoryRouter>,
  );
}

describe('ClienteListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders clientes in table with masked CPF and status badges', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue([clienteAtivo, clienteInativo]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });

    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText('***.123.456-**')).toBeInTheDocument();
    expect(screen.getByText('***.987.654-**')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('shows empty state when no clientes are registered', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nenhum cliente cadastrado/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /cadastrar primeiro cliente/i })).toHaveAttribute(
      'href',
      '/admin/clientes/novo',
    );
  });

  it('displays clientes in the order returned by the API', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue([clienteAtivo, clienteInativo]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const bodyText = rows.slice(1).map((row) => row.textContent).join('|');
    expect(bodyText.indexOf('Ana Costa')).toBeLessThan(bodyText.indexOf('Bruno Lima'));
  });

  it('debounces search and calls listar with query after 300ms', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(clientesApi.listar).toHaveBeenCalledWith(undefined);
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar por nome ou cpf/i), {
      target: { value: 'ana' },
    });

    expect(clientesApi.listar).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(clientesApi.listar).toHaveBeenCalledWith('ana');
    });
  });

  it('shows no results message when search returns empty', async () => {
    vi.mocked(clientesApi.listar).mockImplementation(async (q) => {
      if (q) return [];
      return [clienteAtivo];
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar por nome ou cpf/i), {
      target: { value: 'xyz' },
    });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
    });
  });

  it('toggles cliente status when action button is clicked', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue([clienteAtivo]);
    vi.mocked(clientesApi.alterarStatus).mockResolvedValue({
      id: 1,
      nome: 'Ana Costa',
      cpf: '12345678901',
      status: 'INATIVO',
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T11:00:00Z',
      fotoUrls: [],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /desativar ana costa/i }));

    await waitFor(() => {
      expect(clientesApi.alterarStatus).toHaveBeenCalledWith(1, 'INATIVO');
    });

    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });
});
