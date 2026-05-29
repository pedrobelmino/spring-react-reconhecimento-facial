import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as accessApi from '../api/accessApi';
import * as useRecognitionLoopModule from '../hooks/useRecognitionLoop';
import EntradaPage from './EntradaPage';

vi.mock('../api/accessApi');
vi.mock('../hooks/useRecognitionLoop');

const mockVideoRef = { current: null };

function mockRecognitionLoop(overrides: Partial<useRecognitionLoopModule.UseRecognitionLoopResult> = {}) {
  vi.mocked(useRecognitionLoopModule.useRecognitionLoop).mockReturnValue({
    feedback: null,
    multiFaceWarning: false,
    cameraOnline: true,
    cameraError: null,
    videoRef: mockVideoRef,
    retry: vi.fn(),
    ...overrides,
  });
}

describe('EntradaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessApi.getStatus).mockResolvedValue({
      clientesAtivosComFaces: 3,
      operacional: true,
    });
    mockRecognitionLoop();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders waiting state with compact camera preview', () => {
    render(<EntradaPage />);

    expect(screen.getByTestId('waiting-state')).toHaveTextContent(/aguardando pessoa/i);
    expect(screen.getByTestId('entrada-video')).toBeInTheDocument();
    expect(screen.getByTestId('entrada-page')).not.toHaveClass('overflow-hidden');
  });

  it('shows camera status dot', () => {
    render(<EntradaPage />);

    expect(screen.getByTestId('camera-status-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('camera-status-dot')).toHaveClass('bg-emerald-400');
  });

  it('shows empty base banner when operacional is false', async () => {
    vi.mocked(accessApi.getStatus).mockResolvedValue({
      clientesAtivosComFaces: 0,
      operacional: false,
    });

    render(<EntradaPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-base-banner')).toHaveTextContent(/aguardando cadastro/i);
    });
  });

  it('shows friendly multi-face warning', () => {
    mockRecognitionLoop({ multiFaceWarning: true });

    render(<EntradaPage />);

    expect(screen.getByTestId('multi-face-warning')).toHaveTextContent(/fique sozinho/i);
  });

  it('shows welcome card when client is recognized', () => {
    mockRecognitionLoop({
      feedback: {
        outcome: 'LIBERADO',
        nome: 'João Silva',
        fotoUrl: '/api/clientes/1/foto/1',
        clienteId: 1,
        visible: true,
      },
    });

    render(<EntradaPage />);

    expect(screen.getByTestId('welcome-guest-card')).toBeInTheDocument();
    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.queryByTestId('waiting-state')).not.toBeInTheDocument();
    expect(screen.queryByText(/acesso liberado/i)).not.toBeInTheDocument();
  });

  it('shows friendly camera error without technical message', () => {
    mockRecognitionLoop({
      cameraOnline: false,
      cameraError: 'Permission denied by system',
    });

    render(<EntradaPage />);

    expect(screen.getByTestId('camera-error-panel')).toHaveTextContent(/não foi possível usar a câmera/i);
    expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument();
  });
});
