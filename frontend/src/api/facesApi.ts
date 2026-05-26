import type { FaceImageRequest } from '../types/access';
import { apiPost } from './client';

export interface FaceValidationResponse {
  valid: boolean;
  message: string;
  faceCount: number;
}

export async function validateFace(imageBase64: string): Promise<FaceValidationResponse> {
  const body: FaceImageRequest = { imageBase64 };
  return apiPost<FaceValidationResponse>('/api/faces/validate', body);
}
