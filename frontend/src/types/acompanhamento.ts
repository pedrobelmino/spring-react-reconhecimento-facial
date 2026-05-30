export type AcompanhamentoStatus = 'ATIVO' | 'INATIVO';

export interface AcompanhamentoSummary {
  id: number;
  clienteId: number;
  clienteNome: string;
  dataConsulta: string;
  pesoKg: number | null;
  profissional: string | null;
  status: AcompanhamentoStatus;
  createdAt: string;
}

export interface Acompanhamento {
  id: number;
  clienteId: number;
  clienteNome: string;
  dataConsulta: string;
  pesoKg: number | null;
  profissional: string | null;
  objetivo: string | null;
  orientacoes: string | null;
  proximaConsulta: string | null;
  status: AcompanhamentoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcompanhamentoRequest {
  clienteId: number;
  dataConsulta: string;
  pesoKg?: number;
  profissional?: string;
  objetivo?: string;
  orientacoes?: string;
  proximaConsulta?: string;
}

export interface UpdateAcompanhamentoRequest {
  dataConsulta: string;
  pesoKg?: number;
  profissional?: string;
  objetivo?: string;
  orientacoes?: string;
  proximaConsulta?: string;
}

export interface ListarAcompanhamentosParams {
  clienteId?: number;
  q?: string;
}
