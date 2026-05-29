import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alterarStatus, listar } from '../api/clientesApi';
import type { ClienteStatus, ClienteSummary } from '../types/cliente';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function StatusBadge({ status }: { status: ClienteStatus }) {
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

export default function ClienteListPage() {
  const [clientes, setClientes] = useState<ClienteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadClientes() {
      setLoading(true);
      try {
        const data = await listar(debouncedQuery || undefined);
        if (!cancelled) {
          setClientes(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClientes();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  async function handleToggleStatus(cliente: ClienteSummary) {
    const newStatus: ClienteStatus = cliente.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    setTogglingId(cliente.id);
    try {
      await alterarStatus(cliente.id, newStatus);
      setClientes((prev) =>
        prev.map((item) => (item.id === cliente.id ? { ...item, status: newStatus } : item)),
      );
    } finally {
      setTogglingId(null);
    }
  }

  const showEmptyState = !loading && clientes.length === 0 && !debouncedQuery;
  const showNoResults = !loading && clientes.length === 0 && debouncedQuery;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <Link
          to="/admin/clientes/novo"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Novo cliente
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Buscar por nome ou CPF"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-md"
        />
      </div>

      {loading && <p className="text-sm text-gray-600">Carregando...</p>}

      {showEmptyState && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600">Nenhum cliente cadastrado.</p>
          <Link
            to="/admin/clientes/novo"
            className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Cadastrar primeiro cliente
          </Link>
        </div>
      )}

      {showNoResults && (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
          Nenhum resultado encontrado.
        </p>
      )}

      {!loading && clientes.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Nome
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  CPF
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
              {clientes.map((cliente) => {
                const isAtivo = cliente.status === 'ATIVO';
                const toggleLabel = isAtivo ? `Desativar ${cliente.nome}` : `Ativar ${cliente.nome}`;

                return (
                  <tr key={cliente.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{cliente.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{cliente.cpfMascarado}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge status={cliente.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(cliente.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/clientes/${cliente.id}/editar`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 shadow-sm hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          aria-label={toggleLabel}
                          disabled={togglingId === cliente.id}
                          onClick={() => handleToggleStatus(cliente)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAtivo ? 'Desativar' : 'Ativar'}
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
