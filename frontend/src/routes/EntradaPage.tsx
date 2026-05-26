import { useEffect, useState } from 'react';
import * as accessApi from '../api/accessApi';
import { AccessFeedbackOverlay } from '../components/AccessFeedbackOverlay';
import { CameraStatusIndicator } from '../components/CameraStatusIndicator';
import { useRecognitionLoop } from '../hooks/useRecognitionLoop';

export default function EntradaPage() {
  const { feedback, multiFaceWarning, cameraOnline, cameraError, videoRef, retry } =
    useRecognitionLoop();
  const [operacional, setOperacional] = useState(true);

  useEffect(() => {
    void accessApi.getStatus().then((status) => {
      setOperacional(status.operacional);
    });
  }, []);

  return (
    <div
      data-testid="entrada-page"
      className="relative h-screen w-screen overflow-hidden bg-black"
    >
      <CameraStatusIndicator
        online={cameraOnline}
        errorMessage={cameraError ?? undefined}
      />

      {!operacional && (
        <div
          data-testid="empty-base-banner"
          className="absolute left-0 right-0 top-16 z-20 bg-access-warning/80 px-4 py-3 text-center text-sm font-medium text-black"
        >
          Nenhum cliente cadastrado com face ativa. Cadastre clientes no painel admin.
        </div>
      )}

      <video
        ref={videoRef}
        data-testid="entrada-video"
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />

      {multiFaceWarning && (
        <div
          data-testid="multi-face-warning"
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-access-warning/80 px-6 py-3 text-center font-medium text-black"
        >
          Posicione apenas uma pessoa na frente da câmera
        </div>
      )}

      {!cameraOnline && cameraError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 px-6 text-center text-white">
          <p className="mb-4 text-lg">{cameraError}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {feedback && (
        <AccessFeedbackOverlay
          outcome={feedback.outcome}
          nome={feedback.nome}
          fotoUrl={feedback.fotoUrl}
          visible={feedback.visible}
        />
      )}
    </div>
  );
}
