import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiPost } from './client';
import { validateFace } from './facesApi';
import type { FaceValidationResponse } from './facesApi';

vi.mock('./client');

describe('facesApi', () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
  });

  it('validateFace calls POST /api/faces/validate with imageBase64', async () => {
    const response: FaceValidationResponse = {
      valid: true,
      message: 'Rosto detectado.',
      faceCount: 1,
    };
    vi.mocked(apiPost).mockResolvedValue(response);

    const result = await validateFace('data:image/jpeg;base64,abc123');

    expect(apiPost).toHaveBeenCalledWith('/api/faces/validate', {
      imageBase64: 'data:image/jpeg;base64,abc123',
    });
    expect(result).toEqual(response);
  });

  it('validateFace returns invalid response when no face detected', async () => {
    const response: FaceValidationResponse = {
      valid: false,
      message: 'Rosto não detectado. Tente novamente.',
      faceCount: 0,
    };
    vi.mocked(apiPost).mockResolvedValue(response);

    const result = await validateFace('base64payload');

    expect(result.valid).toBe(false);
    expect(result.faceCount).toBe(0);
    expect(result.message).toBe('Rosto não detectado. Tente novamente.');
  });

  it('validateFace returns invalid response for multiple faces', async () => {
    const response: FaceValidationResponse = {
      valid: false,
      message: 'Posicione apenas uma pessoa',
      faceCount: 2,
    };
    vi.mocked(apiPost).mockResolvedValue(response);

    const result = await validateFace('base64payload');

    expect(result.valid).toBe(false);
    expect(result.faceCount).toBe(2);
    expect(result.message).toBe('Posicione apenas uma pessoa');
  });
});
