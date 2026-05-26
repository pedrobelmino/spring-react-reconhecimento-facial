import { useCallback, useState } from 'react';
import type { AccessOutcome } from '../types/access';

export const ACCESS_SOUND_STORAGE_KEY = 'faceaccess.access-sound-enabled';

const GRANTED_FREQUENCY = 880;
const DENIED_FREQUENCY = 220;

function readEnabledFromStorage(): boolean {
  return localStorage.getItem(ACCESS_SOUND_STORAGE_KEY) === 'true';
}

function writeEnabledToStorage(enabled: boolean): void {
  localStorage.setItem(ACCESS_SOUND_STORAGE_KEY, String(enabled));
}

function playBeep(frequency: number, durationSeconds: number): void {
  const AudioContextClass =
    globalThis.AudioContext ??
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(0.25, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationSeconds);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + durationSeconds);
}

export interface UseAccessSoundResult {
  enabled: boolean;
  toggle: () => void;
  playForOutcome: (outcome: AccessOutcome) => void;
}

export function useAccessSound(): UseAccessSoundResult {
  const [enabled, setEnabled] = useState(readEnabledFromStorage);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      writeEnabledToStorage(next);
      return next;
    });
  }, []);

  const playForOutcome = useCallback(
    (outcome: AccessOutcome) => {
      if (!enabled) {
        return;
      }

      if (outcome === 'LIBERADO') {
        playBeep(GRANTED_FREQUENCY, 0.15);
      } else {
        playBeep(DENIED_FREQUENCY, 0.25);
      }
    },
    [enabled],
  );

  return { enabled, toggle, playForOutcome };
}
