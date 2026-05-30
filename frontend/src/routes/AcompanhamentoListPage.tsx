import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alterarStatus, listar } from '../api/acompanhamentosApi';
import ClienteSelect from '../components/ClienteSelect';
import type { AcompanhamentoStatus, AcompanhamentoSummary } from '../types/acompanhamento';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatPeso(pesoKg: number | null): string {
  if (pesoKg == null) return '—';
  return `${pesoKg.toLocaleString('pt-BR')} kg`;
}

function StatusBadge({ status }: { status: AcompanhamentoStatus }) {
  const isAtivo = status === 'ATIVO';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAtivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isAtivo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

export default function AcompanhamentoListPage() {
  const [acompanhamentos, setAcompanhamentos] = useState<AcompanhamentoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteIdFilter, setClienteIdFilter] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadAcompanhamentos() {
      setLoading(true);
      try {
        const params: { clienteId?: number; q?: string } = {};
        if (clienteIdFilter != null) {
          params.clienteId = clienteIdFilter;
        }
        if (debouncedQuery) {
          params.q = debouncedQuery;
        }
        const data = await listar(Object.keys(params).length > 0 ? params : undefined);
        if (!cancelled) {
          setAcompanhamentos(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAcompanhamentos();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, clienteIdFilter]);

  async function handleToggleStatus(acompanhamento: AcompanhamentoSummary) {
    const newStatus: AcompanhamentoStatus =
      acompanhamento.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    setTogglingId(acompanhamento.id);
    try {
      await alterarStatus(acompanhamento.id, newStatus);
      setAcompanhamentos((prev) =>
        prev.map((item) => (item.id === acompanhamento.id ? { ...item, status: newStatus } : item)),
      );
    } finally {
      setTogglingId(null);
    }
  }

  const hasFilters = debouncedQuery !== '' || clienteIdFilter != null;
  const showEmptyState = !loading && acompanhamentos.length === 0 && !hasFilters;
  const showNoResults = !loading && acompanhamentos.length === 0 && hasFilters;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Acompanhamento nutricional</h1>
        <Link
          to="/admin/acompanhamentos/novo"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Novo acompanhamento
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <ClienteSelect
            value={clienteIdFilter}
            onChange={setClienteIdFilter}
            placeholder="Todos os clientes"
          />
        </div>
        <div className="flex-1">
          <input
            type="search"
            placeholder="Buscar por cliente ou profissional"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Carregando...</p>}

      {showEmptyState && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600">Nenhum acompanhamento cadastrado.</p>
          <Link
            to="/admin/acompanhamentos/novo"
            className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Cadastrar primeiro acompanhamento
          </Link>
        </div>
      )}

      {showNoResults && (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
          Nenhum resultado encontrado.
        </p>
      )}

      {!loading && acompanhamentos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Data consulta
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Peso
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Profissional
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Cadastro
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {acompanhamentos.map((acompanhamento) => {
                const isAtivo = acompanhamento.status === 'ATIVO';
                const toggleLabel = isAtivo
                  ? `Inativar acompanhamento de ${acompanhamento.clienteNome}`
                  : `Ativar acompanhamento de ${acompanhamento.clienteNome}`;

                return (
                  <tr key={acompanhamento.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {acompanhamento.clienteNome}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(acompanhamento.dataConsulta)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatPeso(acompanhamento.pesoKg)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {acompanhamento.profissional ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge status={acompanhamento.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(acompanhamento.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/acompanhamentos/${acompanhamento.id}/editar`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 shadow-sm hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          aria-label={toggleLabel}
                          disabled={togglingId === acompanhamento.id}
                          onClick={() => handleToggleStatus(acompanhamento)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAtivo ? 'Inativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
