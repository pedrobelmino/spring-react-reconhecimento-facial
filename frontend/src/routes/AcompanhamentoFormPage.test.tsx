import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AcompanhamentoFormPage from './AcompanhamentoFormPage';
import * as acompanhamentosApi from '../api/acompanhamentosApi';
import * as clientesApi from '../api/clientesApi';
import type { Acompanhamento } from '../types/acompanhamento';
import type { ClienteSummary } from '../types/cliente';

vi.mock('../api/acompanhamentosApi');
vi.mock('../api/clientesApi');

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockClientes: ClienteSummary[] = [
  {
    id: 10,
    nome: 'Maria Silva',
    cpfMascarado: '***.123.456-**',
    status: 'ATIVO',
    createdAt: '2026-05-25T10:00:00Z',
  },
];

const mockAcompanhamento: Acompanhamento = {
  id: 1,
  clienteId: 10,
  clienteNome: 'Maria Silva',
  dataConsulta: '2026-05-20',
  pesoKg: 72.5,
  profissional: 'Dr. Ana',
  objetivo: 'Emagrecimento',
  orientacoes: 'Aumentar proteína',
  proximaConsulta: '2026-06-20',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

function renderCreateForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/acompanhamentos/novo']}>
      <Routes>
        <Route path="/admin/acompanhamentos/novo" element={<AcompanhamentoFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditForm(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/acompanhamentos/${id}/editar`]}>
      <Routes>
        <Route path="/admin/acompanhamentos/:id/editar" element={<AcompanhamentoFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function selectCliente() {
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'Maria Silva' })).toBeInTheDocument();
  });
  fireEvent.change(screen.getByTestId('cliente-select'), { target: { value: '10' } });
}

function fillRequiredCreateFields() {
  fireEvent.change(screen.getByLabelText(/data da consulta/i), { target: { value: '2026-05-20' } });
}

describe('AcompanhamentoFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-30T12:00:00'));
    vi.mocked(clientesApi.listar).mockResolvedValue(mockClientes);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders create form with all fields', async () => {
    renderCreateForm();

    expect(screen.getByRole('heading', { name: /novo acompanhamento/i })).toBeInTheDocument();
    expect(screen.getByTestId('cliente-select')).toBeInTheDocument();
    expect(screen.getByLabelText(/data da consulta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/peso \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^profissional$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^objetivo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^orientações$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/próxima consulta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Maria Silva' })).toBeInTheDocument();
    });
  });

  it('shows client-side validation error when cliente is missing', async () => {
    renderCreateForm();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Maria Silva' })).toBeInTheDocument();
    });

    fillRequiredCreateFields();
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/cliente é obrigatório/i)).toBeInTheDocument();
    });

    expect(acompanhamentosApi.criar).not.toHaveBeenCalled();
  });

  it('shows client-side validation error when dataConsulta is future', async () => {
    renderCreateForm();

    await selectCliente();
    fireEvent.change(screen.getByLabelText(/data da consulta/i), { target: { value: '2026-06-01' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/data da consulta não pode ser futura/i)).toBeInTheDocument();
    });

    expect(acompanhamentosApi.criar).not.toHaveBeenCalled();
  });

  it('shows client-side validation error when peso is out of range', async () => {
    renderCreateForm();

    await selectCliente();
    fillRequiredCreateFields();
    fireEvent.change(screen.getByLabelText(/peso \(kg\)/i), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/peso deve estar entre 20 e 500 kg/i)).toBeInTheDocument();
    });

    expect(acompanhamentosApi.criar).not.toHaveBeenCalled();
  });

  it('submits create form with criar when data is valid', async () => {
    vi.mocked(acompanhamentosApi.criar).mockResolvedValue(mockAcompanhamento);

    renderCreateForm();

    await selectCliente();
    fillRequiredCreateFields();
    fireEvent.change(screen.getByLabelText(/peso \(kg\)/i), { target: { value: '72.5' } });
    fireEvent.change(screen.getByLabelText(/^profissional$/i), { target: { value: 'Dr. Ana' } });
    fireEvent.change(screen.getByLabelText(/^objetivo$/i), { target: { value: 'Emagrecimento' } });
    fireEvent.change(screen.getByLabelText(/^orientações$/i), { target: { value: 'Aumentar proteína' } });
    fireEvent.change(screen.getByLabelText(/próxima consulta/i), { target: { value: '2026-06-20' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(acompanhamentosApi.criar).toHaveBeenCalledWith({
        clienteId: 10,
        dataConsulta: '2026-05-20',
        pesoKg: 72.5,
        profissional: 'Dr. Ana',
        objetivo: 'Emagrecimento',
        orientacoes: 'Aumentar proteína',
        proximaConsulta: '2026-06-20',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/acompanhamentos');
  });

  it('loads acompanhamento data in edit mode with read-only cliente link', async () => {
    vi.mocked(acompanhamentosApi.buscar).mockResolvedValue(mockAcompanhamento);

    renderEditForm();

    await waitFor(() => {
      expect(acompanhamentosApi.buscar).toHaveBeenCalledWith(1);
    });

    expect(screen.getByRole('heading', { name: /editar acompanhamento/i })).toBeInTheDocument();
    expect(screen.queryByTestId('cliente-select')).not.toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /editar cliente/i })).toHaveAttribute(
      'href',
      '/admin/clientes/10/editar',
    );
    expect(screen.getByLabelText(/data da consulta/i)).toHaveValue('2026-05-20');
    expect(screen.getByLabelText(/peso \(kg\)/i)).toHaveValue(72.5);
    expect(screen.getByLabelText(/^profissional$/i)).toHaveValue('Dr. Ana');
    expect(screen.getByLabelText(/^objetivo$/i)).toHaveValue('Emagrecimento');
    expect(screen.getByLabelText(/^orientações$/i)).toHaveValue('Aumentar proteína');
    expect(screen.getByLabelText(/próxima consulta/i)).toHaveValue('2026-06-20');
  });

  it('submits edit form with atualizar without clienteId', async () => {
    vi.mocked(acompanhamentosApi.buscar).mockResolvedValue(mockAcompanhamento);
    vi.mocked(acompanhamentosApi.atualizar).mockResolvedValue({
      ...mockAcompanhamento,
      pesoKg: 71,
    });

    renderEditForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/peso \(kg\)/i)).toHaveValue(72.5);
    });

    fireEvent.change(screen.getByLabelText(/peso \(kg\)/i), { target: { value: '71' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(acompanhamentosApi.atualizar).toHaveBeenCalledWith(1, {
        dataConsulta: '2026-05-20',
        pesoKg: 71,
        profissional: 'Dr. Ana',
        objetivo: 'Emagrecimento',
        orientacoes: 'Aumentar proteína',
        proximaConsulta: '2026-06-20',
      });
    });

    expect(acompanhamentosApi.atualizar).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ clienteId: expect.anything() }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/admin/acompanhamentos');
  });

  it('shows API error when submit fails', async () => {
    vi.mocked(acompanhamentosApi.criar).mockRejectedValue(new Error('Data não pode ser futura'));

    renderCreateForm();

    await selectCliente();
    fillRequiredCreateFields();
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/data não pode ser futura/i);
    });
  });
});
