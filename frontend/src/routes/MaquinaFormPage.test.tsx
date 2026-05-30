import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MaquinaFormPage from './MaquinaFormPage';
import * as maquinasApi from '../api/maquinasApi';
import type { Maquina } from '../types/maquina';

vi.mock('../api/maquinasApi');

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockMaquina: Maquina = {
  id: 1,
  nome: 'Esteira 01',
  tipo: 'CARDIO',
  marca: 'Technogym',
  modelo: 'Run 500',
  codigoPatrimonio: 'PAT-001',
  localizacao: 'Sala cardio',
  status: 'ATIVA',
  observacoes: 'Revisão mensal',
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

function renderCreateForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/maquinas/novo']}>
      <Routes>
        <Route path="/admin/maquinas/novo" element={<MaquinaFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditForm(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/maquinas/${id}/editar`]}>
      <Routes>
        <Route path="/admin/maquinas/:id/editar" element={<MaquinaFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Esteira 01' } });
  fireEvent.change(screen.getByLabelText(/^tipo$/i), { target: { value: 'CARDIO' } });
}

describe('MaquinaFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders create form with all fields', () => {
    renderCreateForm();

    expect(screen.getByRole('heading', { name: /nova máquina/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^tipo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^marca$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^modelo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/código de patrimônio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^localização$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^observações$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('shows client-side validation error when tipo is missing', async () => {
    renderCreateForm();

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Esteira 01' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/tipo é obrigatório/i)).toBeInTheDocument();
    });

    expect(maquinasApi.criar).not.toHaveBeenCalled();
  });

  it('submits create form with criar when data is valid', async () => {
    vi.mocked(maquinasApi.criar).mockResolvedValue(mockMaquina);

    renderCreateForm();

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/^marca$/i), { target: { value: 'Technogym' } });
    fireEvent.change(screen.getByLabelText(/^modelo$/i), { target: { value: 'Run 500' } });
    fireEvent.change(screen.getByLabelText(/código de patrimônio/i), { target: { value: 'PAT-001' } });
    fireEvent.change(screen.getByLabelText(/^localização$/i), { target: { value: 'Sala cardio' } });
    fireEvent.change(screen.getByLabelText(/^observações$/i), { target: { value: 'Revisão mensal' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(maquinasApi.criar).toHaveBeenCalledWith({
        nome: 'Esteira 01',
        tipo: 'CARDIO',
        marca: 'Technogym',
        modelo: 'Run 500',
        codigoPatrimonio: 'PAT-001',
        localizacao: 'Sala cardio',
        observacoes: 'Revisão mensal',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/maquinas');
  });

  it('loads maquina data in edit mode', async () => {
    vi.mocked(maquinasApi.buscar).mockResolvedValue(mockMaquina);

    renderEditForm();

    await waitFor(() => {
      expect(maquinasApi.buscar).toHaveBeenCalledWith(1);
    });

    expect(screen.getByRole('heading', { name: /editar máquina/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Esteira 01');
    expect(screen.getByLabelText(/^tipo$/i)).toHaveValue('CARDIO');
    expect(screen.getByLabelText(/^marca$/i)).toHaveValue('Technogym');
    expect(screen.getByLabelText(/código de patrimônio/i)).toHaveValue('PAT-001');
    expect(screen.getByLabelText(/^observações$/i)).toHaveValue('Revisão mensal');
  });

  it('shows API error when patrimonio is duplicate on create', async () => {
    vi.mocked(maquinasApi.criar).mockRejectedValue(new Error('Código de patrimônio já cadastrado'));

    renderCreateForm();

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/código de patrimônio/i), { target: { value: 'PAT-001' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/código de patrimônio já cadastrado/i);
    });
  });

  it('submits edit form with atualizar when data is valid', async () => {
    vi.mocked(maquinasApi.buscar).mockResolvedValue(mockMaquina);
    vi.mocked(maquinasApi.atualizar).mockResolvedValue({ ...mockMaquina, nome: 'Esteira 02' });

    renderEditForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Esteira 01');
    });

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Esteira 02' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(maquinasApi.atualizar).toHaveBeenCalledWith(1, {
        nome: 'Esteira 02',
        tipo: 'CARDIO',
        marca: 'Technogym',
        modelo: 'Run 500',
        codigoPatrimonio: 'PAT-001',
        localizacao: 'Sala cardio',
        observacoes: 'Revisão mensal',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/maquinas');
  });
});
