import { useEffect, useState } from 'react';
import { listar } from '../api/clientesApi';
import type { ClienteSummary } from '../types/cliente';

export interface ClienteSelectProps {
  value: number | null;
  onChange: (clienteId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const SELECT_CLASS =
  'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function ClienteSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione um cliente',
}: ClienteSelectProps) {
  const [clientes, setClientes] = useState<ClienteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadClientes() {
      setLoading(true);
      try {
        const data = await listar();
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
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const raw = event.target.value;
    onChange(raw === '' ? null : Number(raw));
  }

  const isDisabled = disabled || loading;

  return (
    <select
      data-testid="cliente-select"
      value={value === null ? '' : String(value)}
      onChange={handleChange}
      disabled={isDisabled}
      aria-busy={loading}
      className={SELECT_CLASS}
    >
      <option value="">{loading ? 'Carregando...' : placeholder}</option>
      {!loading &&
        clientes.map((cliente) => (
          <option key={cliente.id} value={String(cliente.id)}>
            {cliente.nome}
          </option>
        ))}
    </select>
  );
}
