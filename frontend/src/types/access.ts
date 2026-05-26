export type AccessOutcome = 'LIBERADO' | 'NEGADO';

export type NegadoMotivo = 'NAO_RECONHECIDO' | 'CLIENTE_INATIVO';

export interface RecognizeResponse {
  outcome: AccessOutcome | null;
  motivo: NegadoMotivo | null;
  clienteId: number | null;
  nome: string | null;
  fotoUrl: string | null;
  eventoRegistrado: boolean;
  confianca: number;
  faceCount: number;
}

export interface AccessStatusResponse {
  clientesAtivosComFaces: number;
  operacional: boolean;
}

export interface FaceImageRequest {
  imageBase64: string;
}
