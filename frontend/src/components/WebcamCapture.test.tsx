import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebcamCapture from './WebcamCapture';
import * as webcamHook from '../hooks/useWebcam';

vi.mock('../hooks/useWebcam');

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockCaptureFrame = vi.fn();
const mockVideoRef = { current: null as HTMLVideoElement | null };

function mockUseWebcam(overrides: Partial<ReturnType<typeof webcamHook.useWebcam>> = {}) {
  vi.mocked(webcamHook.useWebcam).mockReturnValue({
    videoRef: mockVideoRef,
    start: mockStart,
    stop: mockStop,
    captureFrame: mockCaptureFrame,
    error: null,
    isReady: true,
    ...overrides,
  });
}

describe('WebcamCapture', () => {
  beforeEach(() => {
    mockStart.mockResolvedValue(undefined);
    mockCaptureFrame.mockReturnValue('data:image/jpeg;base64,abc123');
    mockUseWebcam();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders video preview and Capturar button', () => {
    render(<WebcamCapture onCapture={vi.fn()} />);

    expect(screen.getByTestId('webcam-preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capturar/i })).toBeInTheDocument();
  });

  it('starts webcam on mount and stops on unmount', () => {
    const { unmount } = render(<WebcamCapture onCapture={vi.fn()} />);

    expect(mockStart).toHaveBeenCalled();

    unmount();
    expect(mockStop).toHaveBeenCalled();
  });

  it('calls onCapture with base64 when Capturar is clicked', () => {
    const onCapture = vi.fn();
    render(<WebcamCapture onCapture={onCapture} />);

    fireEvent.click(screen.getByRole('button', { name: /capturar/i }));

    expect(mockCaptureFrame).toHaveBeenCalled();
    expect(onCapture).toHaveBeenCalledWith('data:image/jpeg;base64,abc123');
  });

  it('shows error message when webcam access fails', () => {
    mockUseWebcam({ error: 'Permission denied', isReady: false });

    render(<WebcamCapture onCapture={vi.fn()} />);

    expect(screen.getByTestId('webcam-error')).toHaveTextContent('Permission denied');
    expect(screen.getByRole('button', { name: /capturar/i })).toBeDisabled();
  });
});
