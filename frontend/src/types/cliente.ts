export type ClienteStatus = 'ATIVO' | 'INATIVO';

export interface ClienteSummary {
  id: number;
  nome: string;
  cpfMascarado: string;
  status: ClienteStatus;
  createdAt: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  status: ClienteStatus;
  createdAt: string;
  updatedAt: string;
  fotoUrls: string[];
}

export interface CreateClienteRequest {
  nome: string;
  cpf: string;
  photosBase64: [string, string];
}

export interface UpdateClienteRequest {
  nome: string;
  cpf: string;
  photosBase64?: string[];
}

export interface StatusRequest {
  status: ClienteStatus;
}
