export type AccessFeedbackOutcome = 'LIBERADO' | 'NEGADO';

export interface AccessFeedbackOverlayProps {
  outcome: AccessFeedbackOutcome;
  nome?: string;
  fotoUrl?: string;
  visible: boolean;
}

export function AccessFeedbackOverlay({
  outcome,
  nome,
  fotoUrl,
  visible,
}: AccessFeedbackOverlayProps) {
  if (!visible) {
    return null;
  }

  const isGranted = outcome === 'LIBERADO';
  const showPhoto = Boolean(fotoUrl && nome);
  const message = isGranted ? 'Acesso liberado' : 'Acesso negado';

  return (
    <div
      data-testid="access-feedback-overlay"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-white ${
        isGranted ? 'bg-access-granted/90' : 'bg-access-denied/90'
      }`}
    >
      {showPhoto && (
        <img
          src={fotoUrl}
          alt={nome}
          className="mb-6 h-40 w-40 rounded-full object-cover ring-4 ring-white"
        />
      )}
      {nome && <p className="mb-2 text-3xl font-semibold">{nome}</p>}
      <p className="text-4xl font-bold uppercase tracking-wide">{message}</p>
    </div>
  );
}
