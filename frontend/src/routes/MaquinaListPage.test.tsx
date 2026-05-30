import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MaquinaListPage from './MaquinaListPage';
import * as maquinasApi from '../api/maquinasApi';
import type { MaquinaSummary } from '../types/maquina';

vi.mock('../api/maquinasApi');

const maquinaAtiva: MaquinaSummary = {
  id: 1,
  nome: 'Esteira 01',
  tipo: 'CARDIO',
  status: 'ATIVA',
  localizacao: 'Andar térreo — área cardio',
  createdAt: '2026-05-25T10:00:00Z',
};

const maquinaManutencao: MaquinaSummary = {
  id: 2,
  nome: 'Leg Press',
  tipo: 'MUSCULACAO',
  status: 'MANUTENCAO',
  localizacao: null,
  createdAt: '2026-05-20T08:00:00Z',
};

const maquinaInativa: MaquinaSummary = {
  id: 3,
  nome: 'Bicicleta ergométrica',
  tipo: 'CARDIO',
  status: 'INATIVA',
  localizacao: 'Subsolo',
  createdAt: '2026-05-15T12:00:00Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <MaquinaListPage />
    </MemoryRouter>,
  );
}

describe('MaquinaListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders maquinas in table with tipo, status badges and localizacao', async () => {
    vi.mocked(maquinasApi.listar).mockResolvedValue([maquinaAtiva, maquinaManutencao, maquinaInativa]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Esteira 01')).toBeInTheDocument();
    });

    expect(screen.getByText('Leg Press')).toBeInTheDocument();
    expect(screen.getByText('Bicicleta ergométrica')).toBeInTheDocument();
    expect(screen.getAllByText('Cardio')).toHaveLength(2);
    expect(screen.getByText('Musculação')).toBeInTheDocument();
    expect(screen.getAllByText('Ativa')).toHaveLength(2);
    expect(screen.getAllByText('Manutenção')).toHaveLength(2);
    expect(screen.getAllByText('Inativa')).toHaveLength(2);
    expect(screen.getByText('Andar térreo — área cardio')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows empty state when no maquinas are registered', async () => {
    vi.mocked(maquinasApi.listar).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nenhuma máquina cadastrada/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /cadastrar primeira máquina/i })).toHaveAttribute(
      'href',
      '/admin/maquinas/novo',
    );
  });

  it('debounces search and calls listar with query after 300ms', async () => {
    vi.mocked(maquinasApi.listar).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(maquinasApi.listar).toHaveBeenCalledWith(undefined);
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar por nome, marca ou patrimônio/i), {
      target: { value: 'esteira' },
    });

    expect(maquinasApi.listar).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(maquinasApi.listar).toHaveBeenCalledWith('esteira');
    });
  });

  it('shows no results message when search returns empty', async () => {
    vi.mocked(maquinasApi.listar).mockImplementation(async (q) => {
      if (q) return [];
      return [maquinaAtiva];
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Esteira 01')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar por nome, marca ou patrimônio/i), {
      target: { value: 'xyz' },
    });

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => {
      expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
    });
  });

  it('cycles status ATIVA to MANUTENCAO when action button is clicked', async () => {
    vi.mocked(maquinasApi.listar).mockResolvedValue([maquinaAtiva]);
    vi.mocked(maquinasApi.alterarStatus).mockResolvedValue({
      id: 1,
      nome: 'Esteira 01',
      tipo: 'CARDIO',
      marca: null,
      modelo: null,
      codigoPatrimonio: null,
      localizacao: 'Andar térreo — área cardio',
      status: 'MANUTENCAO',
      observacoes: null,
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T11:00:00Z',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Esteira 01')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /alterar status de esteira 01 para manutenção/i }),
    );

    await waitFor(() => {
      expect(maquinasApi.alterarStatus).toHaveBeenCalledWith(1, 'MANUTENCAO');
    });

    expect(screen.getAllByText('Manutenção').length).toBeGreaterThanOrEqual(1);
  });

  it('links edit action to maquina edit route', async () => {
    vi.mocked(maquinasApi.listar).mockResolvedValue([maquinaAtiva]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Esteira 01')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /editar/i })).toHaveAttribute(
      'href',
      '/admin/maquinas/1/editar',
    );
  });
});
