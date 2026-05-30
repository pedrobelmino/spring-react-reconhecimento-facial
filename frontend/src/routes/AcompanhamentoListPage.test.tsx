import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcompanhamentoListPage from './AcompanhamentoListPage';
import * as acompanhamentosApi from '../api/acompanhamentosApi';
import * as clientesApi from '../api/clientesApi';
import type { AcompanhamentoSummary } from '../types/acompanhamento';
import type { ClienteSummary } from '../types/cliente';

vi.mock('../api/acompanhamentosApi');
vi.mock('../api/clientesApi');

const mockClientes: ClienteSummary[] = [
  {
    id: 10,
    nome: 'Maria Silva',
    cpfMascarado: '***.111.222-**',
    status: 'ATIVO',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 20,
    nome: 'João Santos',
    cpfMascarado: '***.333.444-**',
    status: 'ATIVO',
    createdAt: '2026-05-02T10:00:00Z',
  },
];

const acompanhamentoAtivo: AcompanhamentoSummary = {
  id: 1,
  clienteId: 10,
  clienteNome: 'Maria Silva',
  dataConsulta: '2026-05-20',
  pesoKg: 72.5,
  profissional: 'Dr. Ana',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
};

const acompanhamentoInativo: AcompanhamentoSummary = {
  id: 2,
  clienteId: 20,
  clienteNome: 'João Santos',
  dataConsulta: '2026-05-15',
  pesoKg: null,
  profissional: null,
  status: 'INATIVO',
  createdAt: '2026-05-18T08:00:00Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AcompanhamentoListPage />
    </MemoryRouter>,
  );
}

describe('AcompanhamentoListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(clientesApi.listar).mockResolvedValue(mockClientes);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders acompanhamentos in table with columns and status badges', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([acompanhamentoAtivo, acompanhamentoInativo]);

    renderPage();

    let table: HTMLElement;
    await waitFor(() => {
      table = screen.getByRole('table');
      expect(within(table).getByText('Maria Silva')).toBeInTheDocument();
    });

    expect(within(table!).getByText('João Santos')).toBeInTheDocument();
    expect(within(table!).getByText('Dr. Ana')).toBeInTheDocument();
    expect(within(table!).getByText('Ativo')).toBeInTheDocument();
    expect(within(table!).getByText('Inativo')).toBeInTheDocument();
    expect(within(table!).getByText('72,5 kg')).toBeInTheDocument();
    expect(within(table!).getAllByText('—')).toHaveLength(2);
  });

  it('shows empty state when no acompanhamentos are registered', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nenhum acompanhamento cadastrado/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /cadastrar primeiro acompanhamento/i })).toHaveAttribute(
      'href',
      '/admin/acompanhamentos/novo',
    );
  });

  it('displays acompanhamentos in the order returned by the API', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([acompanhamentoAtivo, acompanhamentoInativo]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const bodyText = rows.slice(1).map((row) => row.textContent).join('|');
    expect(bodyText.indexOf('Maria Silva')).toBeLessThan(bodyText.indexOf('João Santos'));
  });

  it('debounces search and calls listar with q after 300ms', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(acompanhamentosApi.listar).toHaveBeenCalledWith(undefined);
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar por cliente ou profissional/i), {
      target: { value: 'dr ana' },
    });

    expect(acompanhamentosApi.listar).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(acompanhamentosApi.listar).toHaveBeenCalledWith({ q: 'dr ana' });
    });
  });

  it('filters by cliente when ClienteSelect changes', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([acompanhamentoAtivo]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Maria Silva' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('cliente-select'), { target: { value: '10' } });

    await waitFor(() => {
      expect(acompanhamentosApi.listar).toHaveBeenCalledWith({ clienteId: 10 });
    });
  });

  it('shows no results message when search returns empty', async () => {
    vi.mocked(acompanhamentosApi.listar).mockImplementation(async (params) => {
      if (params?.q) return [];
      return [acompanhamentoAtivo];
    });

    renderPage();

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('Maria Silva')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar por cliente ou profissional/i), {
      target: { value: 'xyz' },
    });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
    });
  });

  it('toggles status ATIVO to INATIVO when action button is clicked', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([acompanhamentoAtivo]);
    vi.mocked(acompanhamentosApi.alterarStatus).mockResolvedValue({
      id: 1,
      clienteId: 10,
      clienteNome: 'Maria Silva',
      dataConsulta: '2026-05-20',
      pesoKg: 72.5,
      profissional: 'Dr. Ana',
      objetivo: null,
      orientacoes: null,
      proximaConsulta: null,
      status: 'INATIVO',
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T11:00:00Z',
    });

    renderPage();

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('Maria Silva')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /inativar acompanhamento de maria silva/i }),
    );

    await waitFor(() => {
      expect(acompanhamentosApi.alterarStatus).toHaveBeenCalledWith(1, 'INATIVO');
    });

    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('links edit action to acompanhamento edit route', async () => {
    vi.mocked(acompanhamentosApi.listar).mockResolvedValue([acompanhamentoAtivo]);

    renderPage();

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('Maria Silva')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /editar/i })).toHaveAttribute(
      'href',
      '/admin/acompanhamentos/1/editar',
    );
  });
});
