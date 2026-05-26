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

  it('renders fullscreen layout with video preview', () => {
    render(<EntradaPage />);

    const page = screen.getByTestId('entrada-page');
    expect(page).toHaveClass('h-screen', 'w-screen');
    expect(screen.getByTestId('entrada-video')).toBeInTheDocument();
  });

  it('shows camera status indicator', () => {
    render(<EntradaPage />);

    expect(screen.getByTestId('camera-status-indicator')).toBeInTheDocument();
  });

  it('shows empty base banner when operacional is false', async () => {
    vi.mocked(accessApi.getStatus).mockResolvedValue({
      clientesAtivosComFaces: 0,
      operacional: false,
    });

    render(<EntradaPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-base-banner')).toHaveTextContent(
        /nenhum cliente cadastrado/i,
      );
    });
  });

  it('shows multi-face warning when multiple faces detected', () => {
    mockRecognitionLoop({ multiFaceWarning: true });

    render(<EntradaPage />);

    expect(screen.getByTestId('multi-face-warning')).toHaveTextContent(
      /posicione apenas uma pessoa/i,
    );
  });

  it('shows access feedback overlay when recognition feedback is active', () => {
    mockRecognitionLoop({
      feedback: {
        outcome: 'LIBERADO',
        nome: 'João Silva',
        fotoUrl: '/api/clientes/1/foto/1',
        visible: true,
      },
    });

    render(<EntradaPage />);

    expect(screen.getByTestId('access-feedback-overlay')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Acesso liberado')).toBeInTheDocument();
  });
});
