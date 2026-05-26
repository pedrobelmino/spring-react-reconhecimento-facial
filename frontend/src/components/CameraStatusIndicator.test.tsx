import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CameraStatusIndicator } from './CameraStatusIndicator';

describe('CameraStatusIndicator', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows green dot and online label when camera is online', () => {
    render(<CameraStatusIndicator online />);

    const indicator = screen.getByTestId('camera-status-indicator');
    expect(indicator).toHaveTextContent('Câmera online');
    expect(screen.getByTestId('camera-status-dot')).toHaveClass('bg-access-granted');
    expect(screen.queryByTestId('camera-status-error')).not.toBeInTheDocument();
  });

  it('shows gray dot and error message when camera is offline', () => {
    render(
      <CameraStatusIndicator
        online={false}
        errorMessage="Permissão da webcam negada"
      />,
    );

    expect(screen.getByTestId('camera-status-dot')).toHaveClass('bg-gray-400');
    expect(screen.getByTestId('camera-status-error')).toHaveTextContent(
      'Permissão da webcam negada',
    );
    expect(screen.getByTestId('camera-status-error')).toHaveTextContent(
      'Recarregue a página ou reconecte a câmera',
    );
  });
});
