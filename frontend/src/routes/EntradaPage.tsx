import { useEffect, useState } from 'react';
import * as accessApi from '../api/accessApi';
import { WelcomeGuestCard } from '../components/WelcomeGuestCard';
import { useAccessSound } from '../hooks/useAccessSound';
import { useRecognitionLoop } from '../hooks/useRecognitionLoop';

function friendlyCameraMessage(): string {
  return 'Não foi possível usar a câmera. Verifique as permissões e tente novamente.';
}

export default function EntradaPage() {
  const { feedback, multiFaceWarning, cameraOnline, cameraError, videoRef, retry } =
    useRecognitionLoop();
  const { playForOutcome } = useAccessSound();
  const [operacional, setOperacional] = useState(true);

  const showingWelcome = Boolean(feedback?.visible && feedback.outcome === 'LIBERADO' && feedback.nome);

  useEffect(() => {
    void accessApi.getStatus().then((status) => {
      setOperacional(status.operacional);
    });
  }, []);

  useEffect(() => {
    if (feedback?.visible && feedback.outcome === 'LIBERADO') {
      playForOutcome('LIBERADO');
    }
  }, [feedback, playForOutcome]);

  return (
    <div
      data-testid="entrada-page"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-10"
    >
      <header className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-300/70">
          Academia Face Access
        </p>
        <h1 className="mt-2 text-2xl font-light text-white">Controle de Entrada</h1>
      </header>

      <main className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
          {!operacional && (
            <div
              data-testid="empty-base-banner"
              className="mb-5 rounded-lg bg-amber-400/15 px-4 py-3 text-center text-sm text-amber-100"
            >
              Sistema aguardando cadastro de clientes no painel admin.
            </div>
          )}

          {showingWelcome && feedback?.nome ? (
            <WelcomeGuestCard
              nome={feedback.nome}
              fotoUrl={feedback.fotoUrl}
              visible={feedback.visible}
            />
          ) : (
            <div className="space-y-5">
              <div className="text-center" data-testid="waiting-state">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/60">
                  Aguardando pessoa
                </p>
                <p className="mt-2 text-lg text-white/90">Posicione-se na frente da câmera</p>
              </div>

              {multiFaceWarning && (
                <p
                  data-testid="multi-face-warning"
                  className="rounded-lg bg-amber-400/15 px-4 py-3 text-center text-sm text-amber-100"
                >
                  Por favor, fique sozinho(a) na frente da câmera.
                </p>
              )}
            </div>
          )}

          <div
            className={
              showingWelcome
                ? 'sr-only'
                : 'relative mx-auto mt-5 aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl ring-2 ring-white/15'
            }
          >
            <video
              ref={videoRef}
              data-testid="entrada-video"
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!showingWelcome && (
              <div
                data-testid="camera-status-indicator"
                className="absolute right-3 top-3"
                aria-label={cameraOnline ? 'Câmera ativa' : 'Câmera inativa'}
              >
                <span
                  data-testid="camera-status-dot"
                  className={`block h-2.5 w-2.5 rounded-full shadow ${
                    cameraOnline ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {!cameraOnline && cameraError && (
        <div
          data-testid="camera-error-panel"
          className="mt-6 w-full max-w-md rounded-xl border border-red-400/20 bg-red-950/40 px-5 py-4 text-center"
        >
          <p className="text-sm text-red-100">{friendlyCameraMessage()}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-gray-100"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
