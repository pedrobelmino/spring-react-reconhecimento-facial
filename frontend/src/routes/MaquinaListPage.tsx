import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alterarStatus, listar } from '../api/maquinasApi';
import type { MaquinaStatus, MaquinaSummary, MaquinaTipo } from '../types/maquina';

const TIPO_LABELS: Record<MaquinaTipo, string> = {
  CARDIO: 'Cardio',
  MUSCULACAO: 'Musculação',
  FUNCIONAL: 'Funcional',
  OUTRO: 'Outro',
};

const STATUS_LABELS: Record<MaquinaStatus, string> = {
  ATIVA: 'Ativa',
  MANUTENCAO: 'Manutenção',
  INATIVA: 'Inativa',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function nextStatus(status: MaquinaStatus): MaquinaStatus {
  if (status === 'ATIVA') return 'MANUTENCAO';
  if (status === 'MANUTENCAO') return 'INATIVA';
  return 'ATIVA';
}

function statusCycleActionLabel(status: MaquinaStatus): string {
  const next = nextStatus(status);
  return STATUS_LABELS[next];
}

function StatusBadge({ status }: { status: MaquinaStatus }) {
  const styles: Record<MaquinaStatus, string> = {
    ATIVA: 'bg-green-100 text-green-800',
    MANUTENCAO: 'bg-yellow-100 text-yellow-800',
    INATIVA: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function MaquinaListPage() {
  const [maquinas, setMaquinas] = useState<MaquinaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cyclingId, setCyclingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadMaquinas() {
      setLoading(true);
      try {
        const data = await listar(debouncedQuery || undefined);
        if (!cancelled) {
          setMaquinas(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMaquinas();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  async function handleCycleStatus(maquina: MaquinaSummary) {
    const newStatus = nextStatus(maquina.status);
    setCyclingId(maquina.id);
    try {
      await alterarStatus(maquina.id, newStatus);
      setMaquinas((prev) =>
        prev.map((item) => (item.id === maquina.id ? { ...item, status: newStatus } : item)),
      );
    } finally {
      setCyclingId(null);
    }
  }

  const showEmptyState = !loading && maquinas.length === 0 && !debouncedQuery;
  const showNoResults = !loading && maquinas.length === 0 && debouncedQuery;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Máquinas</h1>
        <Link
          to="/admin/maquinas/novo"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Nova máquina
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Buscar por nome, marca ou patrimônio"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-md"
        />
      </div>

      {loading && <p className="text-sm text-gray-600">Carregando...</p>}

      {showEmptyState && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600">Nenhuma máquina cadastrada.</p>
          <Link
            to="/admin/maquinas/novo"
            className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Cadastrar primeira máquina
          </Link>
        </div>
      )}

      {showNoResults && (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
          Nenhum resultado encontrado.
        </p>
      )}

      {!loading && maquinas.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Nome
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Localização
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
              {maquinas.map((maquina) => {
                const cycleLabel = `Alterar status de ${maquina.nome} para ${statusCycleActionLabel(maquina.status)}`;

                return (
                  <tr key={maquina.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{maquina.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {TIPO_LABELS[maquina.tipo]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge status={maquina.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {maquina.localizacao ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(maquina.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/maquinas/${maquina.id}/editar`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 shadow-sm hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          aria-label={cycleLabel}
                          disabled={cyclingId === maquina.id}
                          onClick={() => handleCycleStatus(maquina)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {statusCycleActionLabel(maquina.status)}
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
