export type MaquinaTipo = 'CARDIO' | 'MUSCULACAO' | 'FUNCIONAL' | 'OUTRO';

export type MaquinaStatus = 'ATIVA' | 'MANUTENCAO' | 'INATIVA';

export interface MaquinaSummary {
  id: number;
  nome: string;
  tipo: MaquinaTipo;
  status: MaquinaStatus;
  localizacao: string | null;
  createdAt: string;
}

export interface Maquina {
  id: number;
  nome: string;
  tipo: MaquinaTipo;
  marca: string | null;
  modelo: string | null;
  codigoPatrimonio: string | null;
  localizacao: string | null;
  status: MaquinaStatus;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaquinaRequest {
  nome: string;
  tipo: MaquinaTipo;
  marca?: string;
  modelo?: string;
  codigoPatrimonio?: string;
  localizacao?: string;
  observacoes?: string;
}

export interface UpdateMaquinaRequest {
  nome: string;
  tipo: MaquinaTipo;
  marca?: string;
  modelo?: string;
  codigoPatrimonio?: string;
  localizacao?: string;
  observacoes?: string;
}
