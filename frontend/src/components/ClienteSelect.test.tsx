import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClienteSelect from './ClienteSelect';
import * as clientesApi from '../api/clientesApi';
import type { ClienteSummary } from '../types/cliente';

vi.mock('../api/clientesApi');

const mockClientes: ClienteSummary[] = [
  {
    id: 1,
    nome: 'Ana Costa',
    cpfMascarado: '***.123.456-**',
    status: 'ATIVO',
    createdAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 2,
    nome: 'Bruno Lima',
    cpfMascarado: '***.987.654-**',
    status: 'ATIVO',
    createdAt: '2026-05-20T08:00:00Z',
  },
];

describe('ClienteSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads clients via listar and renders name options', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue(mockClientes);

    render(<ClienteSelect value={null} onChange={vi.fn()} />);

    expect(screen.getByTestId('cliente-select')).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Carregando...' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ana Costa' })).toBeInTheDocument();
    });

    expect(clientesApi.listar).toHaveBeenCalledWith();
    expect(screen.getByRole('option', { name: 'Bruno Lima' })).toBeInTheDocument();
    expect(screen.getByTestId('cliente-select')).not.toBeDisabled();
  });

  it('calls onChange with cliente id when an option is selected', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue(mockClientes);
    const onChange = vi.fn();

    render(<ClienteSelect value={null} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ana Costa' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('cliente-select'), { target: { value: '1' } });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with null when placeholder option is selected', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue(mockClientes);
    const onChange = vi.fn();

    render(<ClienteSelect value={1} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ana Costa' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('cliente-select'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('stays disabled when disabled prop is true', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue(mockClientes);

    render(<ClienteSelect value={null} onChange={vi.fn()} disabled />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ana Costa' })).toBeInTheDocument();
    });

    expect(screen.getByTestId('cliente-select')).toBeDisabled();
  });

  it('shows custom placeholder on empty option after load', async () => {
    vi.mocked(clientesApi.listar).mockResolvedValue([]);

    render(<ClienteSelect value={null} onChange={vi.fn()} placeholder="Todos os clientes" />);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-select')).not.toBeDisabled();
    });

    expect(screen.getByRole('option', { name: 'Todos os clientes' })).toBeInTheDocument();
  });
});
