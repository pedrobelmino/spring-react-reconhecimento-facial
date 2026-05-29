import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as accessApi from '../api/accessApi';
import { useRecognitionLoop } from './useRecognitionLoop';
import * as useWebcamModule from './useWebcam';

vi.mock('../api/accessApi');
vi.mock('./useWebcam');

const mockCaptureFrame = vi.fn();
const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn();

function mockWebcamReady() {
  vi.mocked(useWebcamModule.useWebcam).mockReturnValue({
    videoRef: { current: null },
    start: mockStart,
    stop: mockStop,
    captureFrame: mockCaptureFrame,
    error: null,
    isReady: true,
  });
}

function mockWebcamNotReady() {
  vi.mocked(useWebcamModule.useWebcam).mockReturnValue({
    videoRef: { current: null },
    start: mockStart,
    stop: mockStop,
    captureFrame: mockCaptureFrame,
    error: null,
    isReady: false,
  });
}

describe('useRecognitionLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCaptureFrame.mockReturnValue('data:image/jpeg;base64,frame1');
    mockStart.mockClear();
    mockStop.mockClear();
    mockWebcamReady();
    vi.mocked(accessApi.recognize).mockResolvedValue({
      outcome: 'LIBERADO',
      motivo: null,
      clienteId: 1,
      nome: 'João Silva',
      fotoUrl: '/api/clientes/1/foto/1',
      eventoRegistrado: true,
      confianca: 0.95,
      faceCount: 1,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initializes with no feedback, no multi-face warning, camera offline when webcam not ready', () => {
    mockWebcamNotReady();

    const { result } = renderHook(() => useRecognitionLoop());

    expect(result.current.feedback).toBeNull();
    expect(result.current.multiFaceWarning).toBe(false);
    expect(result.current.cameraOnline).toBe(false);
  });

  it('starts webcam on mount and reports cameraOnline when ready', async () => {
    const { result } = renderHook(() => useRecognitionLoop());

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(result.current.cameraOnline).toBe(true);
  });

  it('calls recognize with captured frame on interval', async () => {
    renderHook(() => useRecognitionLoop({ intervalMs: 800 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(mockCaptureFrame).toHaveBeenCalled();
    expect(accessApi.recognize).toHaveBeenCalledWith('data:image/jpeg;base64,frame1');
  });

  it('shows feedback on LIBERADO response', async () => {
    const { result } = renderHook(() => useRecognitionLoop({ intervalMs: 800 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(result.current.feedback).toEqual({
      outcome: 'LIBERADO',
      nome: 'João Silva',
      fotoUrl: '/api/clientes/1/foto/1',
      clienteId: 1,
      visible: true,
    });
  });

  it('does not show feedback on NEGADO response', async () => {
    vi.mocked(accessApi.recognize).mockResolvedValue({
      outcome: 'NEGADO',
      motivo: 'NAO_RECONHECIDO',
      clienteId: null,
      nome: null,
      fotoUrl: null,
      eventoRegistrado: true,
      confianca: 0,
      faceCount: 1,
    });

    const { result } = renderHook(() => useRecognitionLoop({ intervalMs: 800 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(result.current.feedback).toBeNull();
  });

  it('does not repeat welcome for same client within cooldown', async () => {
    const { result } = renderHook(() =>
      useRecognitionLoop({ intervalMs: 800, feedbackSeconds: 1 }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(result.current.feedback?.nome).toBe('João Silva');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.feedback).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(result.current.feedback).toBeNull();
  });

  it('pauses recognition during feedback period', async () => {
    renderHook(() =>
      useRecognitionLoop({ intervalMs: 800, feedbackSeconds: 3 }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(accessApi.recognize).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });

    expect(accessApi.recognize).toHaveBeenCalledTimes(1);
  });

  it('resumes recognition after feedback period ends', async () => {
    renderHook(() =>
      useRecognitionLoop({ intervalMs: 800, feedbackSeconds: 3 }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(accessApi.recognize).toHaveBeenCalledTimes(2);
  });

  it('sets multiFaceWarning and skips feedback when faceCount > 1', async () => {
    vi.mocked(accessApi.recognize).mockResolvedValue({
      outcome: null,
      motivo: null,
      clienteId: null,
      nome: null,
      fotoUrl: null,
      eventoRegistrado: false,
      confianca: 0,
      faceCount: 2,
    });

    const { result } = renderHook(() => useRecognitionLoop({ intervalMs: 800 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(result.current.multiFaceWarning).toBe(true);
    expect(result.current.feedback).toBeNull();
  });

  it('retry stops and restarts webcam', () => {
    const { result } = renderHook(() => useRecognitionLoop());

    act(() => {
      result.current.retry();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledTimes(2);
  });
});
