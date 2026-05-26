import { useEffect } from 'react';
import { useWebcam } from '../hooks/useWebcam';

export interface WebcamCaptureProps {
  onCapture: (base64: string) => void;
}

export default function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const { videoRef, start, stop, captureFrame, error, isReady } = useWebcam();

  useEffect(() => {
    void start();
    return () => {
      stop();
    };
  }, [start, stop]);

  function handleCapture() {
    const frame = captureFrame();
    if (frame) {
      onCapture(frame);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          data-testid="webcam-error"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        data-testid="webcam-preview"
        autoPlay
        playsInline
        muted
        className="aspect-video w-full rounded-lg bg-gray-900 object-cover"
      />
      <button
        type="button"
        onClick={handleCapture}
        disabled={!isReady}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Capturar
      </button>
    </div>
  );
}
