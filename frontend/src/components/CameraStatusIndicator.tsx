export interface CameraStatusIndicatorProps {
  online: boolean;
  errorMessage?: string;
}

export function CameraStatusIndicator({ online, errorMessage }: CameraStatusIndicatorProps) {
  return (
    <div data-testid="camera-status-indicator" className="absolute left-4 top-4 z-10">
      <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white">
        <span
          data-testid="camera-status-dot"
          className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-access-granted' : 'bg-gray-400'}`}
          aria-hidden
        />
        <span>{online ? 'Câmera online' : 'Câmera offline'}</span>
      </div>
      {!online && errorMessage && (
        <p
          data-testid="camera-status-error"
          className="mt-2 max-w-xs rounded-lg bg-access-denied/90 px-3 py-2 text-sm text-white"
        >
          {errorMessage}. Recarregue a página ou reconecte a câmera.
        </p>
      )}
    </div>
  );
}
