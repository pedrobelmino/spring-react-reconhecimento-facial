import { useCallback, useEffect, useRef, useState } from 'react';
import * as accessApi from '../api/accessApi';
import type { AccessOutcome } from '../types/access';
import { useWebcam } from './useWebcam';

export interface RecognitionFeedback {
  outcome: AccessOutcome;
  nome?: string;
  fotoUrl?: string;
  visible: boolean;
}

export interface UseRecognitionLoopOptions {
  intervalMs?: number;
  feedbackSeconds?: number;
}

export interface UseRecognitionLoopResult {
  feedback: RecognitionFeedback | null;
  multiFaceWarning: boolean;
  cameraOnline: boolean;
  cameraError: string | null;
  videoRef: ReturnType<typeof useWebcam>['videoRef'];
  retry: () => void;
}

const DEFAULT_INTERVAL_MS = 800;
const DEFAULT_FEEDBACK_SECONDS = 3;

export function useRecognitionLoop(
  options: UseRecognitionLoopOptions = {},
): UseRecognitionLoopResult {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const feedbackSeconds = options.feedbackSeconds ?? DEFAULT_FEEDBACK_SECONDS;

  const { videoRef, captureFrame, start, stop, error, isReady } = useWebcam();
  const [feedback, setFeedback] = useState<RecognitionFeedback | null>(null);
  const [multiFaceWarning, setMultiFaceWarning] = useState(false);

  const processingRef = useRef(false);
  const feedbackActiveRef = useRef(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cameraOnline = isReady && error === null;

  const retry = useCallback(() => {
    stop();
    void start();
  }, [start, stop]);

  useEffect(() => {
    void start();
    return () => {
      stop();
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [start, stop]);

  useEffect(() => {
    const tick = async () => {
      if (feedbackActiveRef.current || processingRef.current || !isReady) {
        return;
      }

      const frame = captureFrame();
      if (!frame) {
        return;
      }

      processingRef.current = true;
      try {
        const response = await accessApi.recognize(frame);

        if (response.faceCount > 1) {
          setMultiFaceWarning(true);
          return;
        }

        setMultiFaceWarning(false);

        if (response.faceCount === 0 || response.outcome === null) {
          return;
        }

        feedbackActiveRef.current = true;
        setFeedback({
          outcome: response.outcome,
          nome: response.nome ?? undefined,
          fotoUrl: response.fotoUrl ?? undefined,
          visible: true,
        });

        feedbackTimeoutRef.current = setTimeout(() => {
          feedbackActiveRef.current = false;
          setFeedback(null);
        }, feedbackSeconds * 1000);
      } catch {
        // API error — preview continues, retry on next interval
      } finally {
        processingRef.current = false;
      }
    };

    const id = setInterval(() => {
      void tick();
    }, intervalMs);

    return () => clearInterval(id);
  }, [captureFrame, isReady, intervalMs, feedbackSeconds]);

  return { feedback, multiFaceWarning, cameraOnline, cameraError: error, videoRef, retry };
}
