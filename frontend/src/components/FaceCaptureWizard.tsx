import { useState } from 'react';
import { validateFace } from '../api/facesApi';
import WebcamCapture from './WebcamCapture';

export interface FaceCaptureWizardProps {
  photos: [string | null, string | null];
  onChange: (photos: [string | null, string | null]) => void;
}

function currentSlotIndex(photos: [string | null, string | null]): number {
  if (photos[0] === null) {
    return 0;
  }
  if (photos[1] === null) {
    return 1;
  }
  return 1;
}

export default function FaceCaptureWizard({ photos, onChange }: FaceCaptureWizardProps) {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bothComplete = photos[0] !== null && photos[1] !== null;
  const slotIndex = currentSlotIndex(photos);
  const slotNumber = bothComplete ? 2 : slotIndex + 1;

  async function handleCapture(base64: string) {
    if (bothComplete) {
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const result = await validateFace(base64);
      if (!result.valid) {
        setError(result.message);
        return;
      }

      const nextPhotos: [string | null, string | null] = [photos[0], photos[1]];
      nextPhotos[slotIndex] = base64;
      onChange(nextPhotos);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Unauthorized') || message.includes('403')) {
        setError('Falha de autenticação. Recarregue a página ou faça login novamente.');
      } else if (message.includes('500') || message.includes('Internal Server Error')) {
        setError('Erro no servidor ao validar o rosto. Verifique se o backend está rodando.');
      } else {
        setError(message || 'Não foi possível validar a foto. Tente novamente.');
      }
    } finally {
      setValidating(false);
    }
  }

  function handleRetake() {
    onChange([null, null]);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <p data-testid="wizard-progress" className="text-sm font-medium text-gray-700">
        Foto {slotNumber} de 2
      </p>

      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {bothComplete ? (
        <div className="space-y-2">
          <p data-testid="wizard-complete" className="text-sm text-green-700">
            Fotos capturadas com sucesso
          </p>
          <button
            type="button"
            onClick={handleRetake}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Refazer fotos
          </button>
        </div>
      ) : (
        <>
          {validating && <p className="text-sm text-gray-600">Validando...</p>}
          <WebcamCapture onCapture={handleCapture} />
        </>
      )}
    </div>
  );
}
