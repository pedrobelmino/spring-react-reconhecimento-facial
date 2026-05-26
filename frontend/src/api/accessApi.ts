import type { AccessStatusResponse, FaceImageRequest, RecognizeResponse } from '../types/access';
import { apiGet, apiPost } from './client';

export async function recognize(imageBase64: string): Promise<RecognizeResponse> {
  const body: FaceImageRequest = { imageBase64 };
  return apiPost<RecognizeResponse>('/api/access/recognize', body);
}

export async function getStatus(): Promise<AccessStatusResponse> {
  return apiGet<AccessStatusResponse>('/api/access/status');
}
