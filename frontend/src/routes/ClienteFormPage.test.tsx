import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClienteFormPage from './ClienteFormPage';
import * as clientesApi from '../api/clientesApi';
import type { Cliente } from '../types/cliente';

vi.mock('../api/clientesApi');

vi.mock('../components/FaceCaptureWizard', () => ({
  default: ({
    onChange,
  }: {
    photos: [string | null, string | null];
    onChange: (photos: [string | null, string | null]) => void;
  }) => (
    <button type="button" data-testid="mock-complete-photos" onClick={() => onChange(['photo1', 'photo2'])}>
      Completar fotos
    </button>
  ),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCliente: Cliente = {
  id: 1,
  nome: 'Maria Silva',
  cpf: '52998224725',
  status: 'ATIVO',
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
  fotoUrls: ['/api/clientes/1/foto/1', '/api/clientes/1/foto/2'],
};

const VALID_CPF = '529.982.247-25';

function renderCreateForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/clientes/novo']}>
      <Routes>
        <Route path="/admin/clientes/novo" element={<ClienteFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditForm(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/clientes/${id}/editar`]}>
      <Routes>
        <Route path="/admin/clientes/:id/editar" element={<ClienteFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClienteFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders create form with nome and CPF fields', () => {
    renderCreateForm();

    expect(screen.getByRole('heading', { name: /novo cliente/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('shows client-side CPF validation error for invalid CPF', async () => {
    renderCreateForm();

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: '111.111.111-11' } });
    fireEvent.click(screen.getByTestId('mock-complete-photos'));
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
    });

    expect(clientesApi.criar).not.toHaveBeenCalled();
  });

  it('submits create form with criar when data and photos are valid', async () => {
    vi.mocked(clientesApi.criar).mockResolvedValue(mockCliente);

    renderCreateForm();

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Maria Silva' } });
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: VALID_CPF } });
    fireEvent.click(screen.getByTestId('mock-complete-photos'));
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(clientesApi.criar).toHaveBeenCalledWith({
        nome: 'Maria Silva',
        cpf: '52998224725',
        photosBase64: ['photo1', 'photo2'],
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/clientes');
  });

  it('loads cliente data in edit mode', async () => {
    vi.mocked(clientesApi.buscar).mockResolvedValue(mockCliente);

    renderEditForm();

    await waitFor(() => {
      expect(clientesApi.buscar).toHaveBeenCalledWith(1);
    });

    expect(screen.getByRole('heading', { name: /editar cliente/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Maria Silva');
    expect(screen.getByLabelText(/cpf/i)).toHaveValue('529.982.247-25');
  });

  it('shows API error when CPF is duplicate on create', async () => {
    vi.mocked(clientesApi.criar).mockRejectedValue(new Error('CPF já cadastrado'));

    renderCreateForm();

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Maria Silva' } });
    fireEvent.change(screen.getByLabelText(/cpf/i), { target: { value: VALID_CPF } });
    fireEvent.click(screen.getByTestId('mock-complete-photos'));
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/cpf já cadastrado/i);
    });
  });

  it('submits edit form with atualizar when data and photos are valid', async () => {
    vi.mocked(clientesApi.buscar).mockResolvedValue(mockCliente);
    vi.mocked(clientesApi.atualizar).mockResolvedValue({ ...mockCliente, nome: 'Maria Santos' });

    renderEditForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toHaveValue('Maria Silva');
    });

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Maria Santos' } });
    fireEvent.click(screen.getByTestId('mock-complete-photos'));
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(clientesApi.atualizar).toHaveBeenCalledWith(1, {
        nome: 'Maria Santos',
        cpf: '52998224725',
        photosBase64: ['photo1', 'photo2'],
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/clientes');
  });
});
