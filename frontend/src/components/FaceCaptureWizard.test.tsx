import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import FaceCaptureWizard from './FaceCaptureWizard';
import * as facesApi from '../api/facesApi';

vi.mock('../api/facesApi');

vi.mock('./WebcamCapture', () => ({
  default: ({ onCapture }: { onCapture: (base64: string) => void }) => (
    <button type="button" onClick={() => onCapture('data:image/jpeg;base64,captured')}>
      Mock Capturar
    </button>
  ),
}));

const validResponse: facesApi.FaceValidationResponse = {
  valid: true,
  message: 'Rosto detectado.',
  faceCount: 1,
};

const invalidResponse: facesApi.FaceValidationResponse = {
  valid: false,
  message: 'Rosto não detectado. Tente novamente.',
  faceCount: 0,
};

describe('FaceCaptureWizard', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onChange.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows progress Foto 1 de 2 on initial slot', () => {
    render(<FaceCaptureWizard photos={[null, null]} onChange={onChange} />);

    expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Foto 1 de 2');
  });

  it('calls validateFace when a photo is captured', async () => {
    vi.mocked(facesApi.validateFace).mockResolvedValue(validResponse);

    render(<FaceCaptureWizard photos={[null, null]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /mock capturar/i }));

    await waitFor(() => {
      expect(facesApi.validateFace).toHaveBeenCalledWith('data:image/jpeg;base64,captured');
    });
  });

  it('does not advance slot when validation fails', async () => {
    vi.mocked(facesApi.validateFace).mockResolvedValue(invalidResponse);

    render(<FaceCaptureWizard photos={[null, null]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /mock capturar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/rosto não detectado/i);
    });

    expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Foto 1 de 2');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('advances to Foto 2 de 2 after first photo validates successfully', async () => {
    vi.mocked(facesApi.validateFace).mockResolvedValue(validResponse);

    render(<FaceCaptureWizard photos={[null, null]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /mock capturar/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['data:image/jpeg;base64,captured', null]);
    });

    cleanup();
    render(
      <FaceCaptureWizard
        photos={['data:image/jpeg;base64,captured', null]}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId('wizard-progress')).toHaveTextContent('Foto 2 de 2');
  });

  it('completes wizard when both photos validate successfully', async () => {
    vi.mocked(facesApi.validateFace).mockResolvedValue(validResponse);

    const { rerender } = render(<FaceCaptureWizard photos={[null, null]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /mock capturar/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['data:image/jpeg;base64,captured', null]);
    });

    rerender(
      <FaceCaptureWizard
        photos={['data:image/jpeg;base64,captured', null]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /mock capturar/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([
        'data:image/jpeg;base64,captured',
        'data:image/jpeg;base64,captured',
      ]);
    });

    rerender(
      <FaceCaptureWizard
        photos={['data:image/jpeg;base64,captured', 'data:image/jpeg;base64,captured']}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId('wizard-complete')).toBeInTheDocument();
  });
});
