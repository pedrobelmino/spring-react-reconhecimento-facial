export interface WelcomeGuestCardProps {
  nome: string;
  fotoUrl?: string;
  visible: boolean;
}

export function WelcomeGuestCard({ nome, fotoUrl, visible }: WelcomeGuestCardProps) {
  if (!visible) {
    return null;
  }

  const firstName = nome.trim().split(/\s+/)[0] ?? nome;

  return (
    <div
      data-testid="welcome-guest-card"
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/50">
        <svg
          aria-hidden
          className="h-8 w-8 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {fotoUrl && (
        <img
          src={fotoUrl}
          alt={nome}
          className="h-28 w-28 rounded-full object-cover ring-4 ring-emerald-400/40 shadow-lg shadow-emerald-900/30"
        />
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-300/80">
          Bem-vindo(a)
        </p>
        <p className="text-3xl font-semibold text-white">{firstName}</p>
        {nome.includes(' ') && (
          <p className="text-base text-white/60">{nome}</p>
        )}
      </div>
    </div>
  );
}
