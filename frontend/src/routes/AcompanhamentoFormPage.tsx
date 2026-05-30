import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { atualizar, buscar, criar } from '../api/acompanhamentosApi';
import ClienteSelect from '../components/ClienteSelect';
import type { CreateAcompanhamentoRequest, UpdateAcompanhamentoRequest } from '../types/acompanhamento';

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isFutureDate(dateStr: string): boolean {
  return dateStr > todayIsoDate();
}

function buildCreatePayload(
  clienteId: number,
  dataConsulta: string,
  pesoKg: string,
  profissional: string,
  objetivo: string,
  orientacoes: string,
  proximaConsulta: string,
): CreateAcompanhamentoRequest {
  const payload: CreateAcompanhamentoRequest = {
    clienteId,
    dataConsulta,
  };

  const peso = pesoKg.trim();
  if (peso) {
    payload.pesoKg = Number(peso);
  }

  const profissionalTrimmed = profissional.trim();
  if (profissionalTrimmed) {
    payload.profissional = profissionalTrimmed;
  }

  const objetivoTrimmed = objetivo.trim();
  if (objetivoTrimmed) {
    payload.objetivo = objetivoTrimmed;
  }

  const orientacoesTrimmed = orientacoes.trim();
  if (orientacoesTrimmed) {
    payload.orientacoes = orientacoesTrimmed;
  }

  const proximaTrimmed = proximaConsulta.trim();
  if (proximaTrimmed) {
    payload.proximaConsulta = proximaTrimmed;
  }

  return payload;
}

function buildUpdatePayload(
  dataConsulta: string,
  pesoKg: string,
  profissional: string,
  objetivo: string,
  orientacoes: string,
  proximaConsulta: string,
): UpdateAcompanhamentoRequest {
  const payload: UpdateAcompanhamentoRequest = {
    dataConsulta,
  };

  const peso = pesoKg.trim();
  if (peso) {
    payload.pesoKg = Number(peso);
  }

  const profissionalTrimmed = profissional.trim();
  if (profissionalTrimmed) {
    payload.profissional = profissionalTrimmed;
  }

  const objetivoTrimmed = objetivo.trim();
  if (objetivoTrimmed) {
    payload.objetivo = objetivoTrimmed;
  }

  const orientacoesTrimmed = orientacoes.trim();
  if (orientacoesTrimmed) {
    payload.orientacoes = orientacoesTrimmed;
  }

  const proximaTrimmed = proximaConsulta.trim();
  if (proximaTrimmed) {
    payload.proximaConsulta = proximaTrimmed;
  }

  return payload;
}

export default function AcompanhamentoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [loadedClienteId, setLoadedClienteId] = useState<number | null>(null);
  const [dataConsulta, setDataConsulta] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [profissional, setProfissional] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [orientacoes, setOrientacoes] = useState('');
  const [proximaConsulta, setProximaConsulta] = useState('');
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [dataConsultaError, setDataConsultaError] = useState<string | null>(null);
  const [pesoError, setPesoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) {
      return;
    }

    let cancelled = false;

    async function loadAcompanhamento() {
      setLoading(true);
      try {
        const acompanhamento = await buscar(Number(id));
        if (!cancelled) {
          setClienteNome(acompanhamento.clienteNome);
          setLoadedClienteId(acompanhamento.clienteId);
          setDataConsulta(acompanhamento.dataConsulta);
          setPesoKg(acompanhamento.pesoKg != null ? String(acompanhamento.pesoKg) : '');
          setProfissional(acompanhamento.profissional ?? '');
          setObjetivo(acompanhamento.objetivo ?? '');
          setOrientacoes(acompanhamento.orientacoes ?? '');
          setProximaConsulta(acompanhamento.proximaConsulta ?? '');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAcompanhamento();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClienteError(null);
    setDataConsultaError(null);
    setPesoError(null);
    setSubmitError(null);

    if (!isEdit && clienteId == null) {
      setClienteError('Cliente é obrigatório');
      return;
    }

    if (!dataConsulta) {
      setDataConsultaError('Data da consulta é obrigatória');
      return;
    }

    if (isFutureDate(dataConsulta)) {
      setDataConsultaError('Data da consulta não pode ser futura');
      return;
    }

    const pesoTrimmed = pesoKg.trim();
    if (pesoTrimmed) {
      const peso = Number(pesoTrimmed);
      if (Number.isNaN(peso) || peso < 20 || peso > 500) {
        setPesoError('Peso deve estar entre 20 e 500 kg');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isEdit && id) {
        const payload = buildUpdatePayload(
          dataConsulta,
          pesoKg,
          profissional,
          objetivo,
          orientacoes,
          proximaConsulta,
        );
        await atualizar(Number(id), payload);
      } else if (clienteId != null) {
        const payload = buildCreatePayload(
          clienteId,
          dataConsulta,
          pesoKg,
          profissional,
          objetivo,
          orientacoes,
          proximaConsulta,
        );
        await criar(payload);
      }

      navigate('/admin/acompanhamentos');
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
        <Link to="/admin/acompanhamentos" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Voltar para acompanhamentos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          {isEdit ? 'Editar acompanhamento' : 'Novo acompanhamento'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {submitError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {isEdit ? (
          <div>
            <span className="block text-sm font-medium text-gray-700">Cliente</span>
            <p className="mt-1 text-sm text-gray-900">
              {clienteNome}{' '}
              {loadedClienteId != null && (
                <Link
                  to={`/admin/clientes/${loadedClienteId}/editar`}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Editar cliente
                </Link>
              )}
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
              Cliente
            </label>
            <div className="mt-1">
              <ClienteSelect value={clienteId} onChange={setClienteId} />
            </div>
            {clienteError && <p className="mt-1 text-sm text-red-600">{clienteError}</p>}
          </div>
        )}

        <div>
          <label htmlFor="dataConsulta" className="block text-sm font-medium text-gray-700">
            Data da consulta
          </label>
          <input
            id="dataConsulta"
            type="date"
            required
            value={dataConsulta}
            onChange={(event) => setDataConsulta(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {dataConsultaError && <p className="mt-1 text-sm text-red-600">{dataConsultaError}</p>}
        </div>

        <div>
          <label htmlFor="pesoKg" className="block text-sm font-medium text-gray-700">
            Peso (kg)
          </label>
          <input
            id="pesoKg"
            type="number"
            step="0.1"
            value={pesoKg}
            onChange={(event) => setPesoKg(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {pesoError && <p className="mt-1 text-sm text-red-600">{pesoError}</p>}
        </div>

        <div>
          <label htmlFor="profissional" className="block text-sm font-medium text-gray-700">
            Profissional
          </label>
          <textarea
            id="profissional"
            rows={2}
            value={profissional}
            onChange={(event) => setProfissional(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="objetivo" className="block text-sm font-medium text-gray-700">
            Objetivo
          </label>
          <textarea
            id="objetivo"
            rows={3}
            value={objetivo}
            onChange={(event) => setObjetivo(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="orientacoes" className="block text-sm font-medium text-gray-700">
            Orientações
          </label>
          <textarea
            id="orientacoes"
            rows={4}
            value={orientacoes}
            onChange={(event) => setOrientacoes(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="proximaConsulta" className="block text-sm font-medium text-gray-700">
            Próxima consulta
          </label>
          <input
            id="proximaConsulta"
            type="date"
            value={proximaConsulta}
            onChange={(event) => setProximaConsulta(event.target.value)}
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
