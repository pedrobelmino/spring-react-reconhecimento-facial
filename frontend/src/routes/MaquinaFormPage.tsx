import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { atualizar, buscar, criar } from '../api/maquinasApi';
import type { CreateMaquinaRequest, MaquinaTipo } from '../types/maquina';

const TIPO_OPTIONS: { value: MaquinaTipo; label: string }[] = [
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'MUSCULACAO', label: 'Musculação' },
  { value: 'FUNCIONAL', label: 'Funcional' },
  { value: 'OUTRO', label: 'Outro' },
];

function buildPayload(
  nome: string,
  tipo: MaquinaTipo | '',
  marca: string,
  modelo: string,
  codigoPatrimonio: string,
  localizacao: string,
  observacoes: string,
): CreateMaquinaRequest {
  return {
    nome: nome.trim(),
    tipo: tipo as MaquinaTipo,
    marca: marca.trim() || undefined,
    modelo: modelo.trim() || undefined,
    codigoPatrimonio: codigoPatrimonio.trim() || undefined,
    localizacao: localizacao.trim() || undefined,
    observacoes: observacoes.trim() || undefined,
  };
}

export default function MaquinaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<MaquinaTipo | ''>('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [codigoPatrimonio, setCodigoPatrimonio] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [nomeError, setNomeError] = useState<string | null>(null);
  const [tipoError, setTipoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) {
      return;
    }

    let cancelled = false;

    async function loadMaquina() {
      setLoading(true);
      try {
        const maquina = await buscar(Number(id));
        if (!cancelled) {
          setNome(maquina.nome);
          setTipo(maquina.tipo);
          setMarca(maquina.marca ?? '');
          setModelo(maquina.modelo ?? '');
          setCodigoPatrimonio(maquina.codigoPatrimonio ?? '');
          setLocalizacao(maquina.localizacao ?? '');
          setObservacoes(maquina.observacoes ?? '');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMaquina();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNomeError(null);
    setTipoError(null);
    setSubmitError(null);

    if (!nome.trim()) {
      setNomeError('Nome é obrigatório');
      return;
    }

    if (!tipo) {
      setTipoError('Tipo é obrigatório');
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload(nome, tipo, marca, modelo, codigoPatrimonio, localizacao, observacoes);

      if (isEdit && id) {
        await atualizar(Number(id), payload);
      } else {
        await criar(payload);
      }

      navigate('/admin/maquinas');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar. Tente novamente.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/maquinas" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Voltar para máquinas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          {isEdit ? 'Editar máquina' : 'Nova máquina'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {submitError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            required
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {nomeError && <p className="mt-1 text-sm text-red-600">{nomeError}</p>}
        </div>

        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(event) => setTipo(event.target.value as MaquinaTipo | '')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Selecione...</option>
            {TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {tipoError && <p className="mt-1 text-sm text-red-600">{tipoError}</p>}
        </div>

        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
            Marca
          </label>
          <input
            id="marca"
            type="text"
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
            Modelo
          </label>
          <input
            id="modelo"
            type="text"
            value={modelo}
            onChange={(event) => setModelo(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="codigoPatrimonio" className="block text-sm font-medium text-gray-700">
            Código de patrimônio
          </label>
          <input
            id="codigoPatrimonio"
            type="text"
            value={codigoPatrimonio}
            onChange={(event) => setCodigoPatrimonio(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="localizacao" className="block text-sm font-medium text-gray-700">
            Localização
          </label>
          <input
            id="localizacao"
            type="text"
            value={localizacao}
            onChange={(event) => setLocalizacao(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
            Observações
          </label>
          <textarea
            id="observacoes"
            rows={4}
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
