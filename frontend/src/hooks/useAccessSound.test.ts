import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccessSound, ACCESS_SOUND_STORAGE_KEY } from './useAccessSound';

const mockOscillatorStart = vi.fn();
const mockOscillatorStop = vi.fn();
const mockGainConnect = vi.fn();
const mockOscillatorConnect = vi.fn();
const mockSetFrequency = vi.fn();

function createMockAudioContext() {
  return {
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: mockSetFrequency },
      connect: mockOscillatorConnect,
      start: mockOscillatorStart,
      stop: mockOscillatorStop,
    })),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: mockGainConnect,
    })),
  };
}

describe('useAccessSound', () => {
  beforeEach(() => {
    localStorage.clear();
    mockOscillatorStart.mockClear();
    mockOscillatorStop.mockClear();
    mockGainConnect.mockClear();
    mockOscillatorConnect.mockClear();
    mockSetFrequency.mockClear();
    vi.stubGlobal('AudioContext', vi.fn(() => createMockAudioContext()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is disabled by default and does not play sounds', () => {
    const { result } = renderHook(() => useAccessSound());

    expect(result.current.enabled).toBe(false);

    act(() => {
      result.current.playForOutcome('LIBERADO');
      result.current.playForOutcome('NEGADO');
    });

    expect(globalThis.AudioContext).not.toHaveBeenCalled();
  });

  it('plays distinct beeps for liberado and negado when enabled', () => {
    localStorage.setItem(ACCESS_SOUND_STORAGE_KEY, 'true');

    const { result } = renderHook(() => useAccessSound());
    expect(result.current.enabled).toBe(true);

    act(() => {
      result.current.playForOutcome('LIBERADO');
    });

    expect(mockSetFrequency).toHaveBeenCalledWith(880, 0);

    act(() => {
      result.current.playForOutcome('NEGADO');
    });

    expect(mockSetFrequency).toHaveBeenLastCalledWith(220, 0);
    expect(mockSetFrequency).toHaveBeenCalledTimes(2);
  });

  it('toggle enables sound and persists preference in localStorage', () => {
    const { result } = renderHook(() => useAccessSound());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(ACCESS_SOUND_STORAGE_KEY)).toBe('true');

    act(() => {
      result.current.toggle();
    });

    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem(ACCESS_SOUND_STORAGE_KEY)).toBe('false');
  });
});
