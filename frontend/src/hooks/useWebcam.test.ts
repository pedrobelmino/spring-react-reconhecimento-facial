import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebcam } from './useWebcam';

function createMockStream() {
  const stop = vi.fn();
  const track = { stop };
  return {
    getTracks: () => [track],
    _trackStop: stop,
  } as unknown as MediaStream & { _trackStop: ReturnType<typeof vi.fn> };
}

describe('useWebcam', () => {
  const mockGetUserMedia = vi.fn();
  let mockStream: MediaStream & { _trackStop: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockStream = createMockStream();
    mockGetUserMedia.mockResolvedValue(mockStream);
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: { getUserMedia: mockGetUserMedia },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with no error and not ready', () => {
    const { result } = renderHook(() => useWebcam());

    expect(result.current.error).toBeNull();
    expect(result.current.isReady).toBe(false);
    expect(result.current.videoRef.current).toBeNull();
  });

  it('start calls getUserMedia and sets isReady', async () => {
    const { result } = renderHook(() => useWebcam());
    const video = document.createElement('video');
    video.play = vi.fn().mockResolvedValue(undefined);
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.start();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
    expect(video.srcObject).toBe(mockStream);
    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('start sets error when getUserMedia fails', async () => {
    mockGetUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    const { result } = renderHook(() => useWebcam());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.isReady).toBe(false);
  });

  it('stop releases stream tracks and clears ready state', async () => {
    const { result } = renderHook(() => useWebcam());
    const video = document.createElement('video');
    video.play = vi.fn().mockResolvedValue(undefined);
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(mockStream._trackStop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    expect(result.current.isReady).toBe(false);
  });

  it('captureFrame returns base64 jpeg when ready', async () => {
    const { result } = renderHook(() => useWebcam());
    const video = document.createElement('video');
    video.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(video, 'videoWidth', { value: 640 });
    Object.defineProperty(video, 'videoHeight', { value: 480 });
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.start();
    });

    const toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,abc123');
    const drawImage = vi.fn();
    const getContext = vi.fn().mockReturnValue({ drawImage });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext,
          toDataURL,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });

    let frame: string | null = null;
    act(() => {
      frame = result.current.captureFrame();
    });

    expect(frame).toBe('data:image/jpeg;base64,abc123');
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg');
  });

  it('captureFrame returns null when not ready', () => {
    const { result } = renderHook(() => useWebcam());

    expect(result.current.captureFrame()).toBeNull();
  });
});
