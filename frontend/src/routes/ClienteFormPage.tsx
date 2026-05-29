import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { atualizar, buscar, criar } from '../api/clientesApi';
import FaceCaptureWizard from '../components/FaceCaptureWizard';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) {
    return cpf;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function calculateVerifierDigit(base: string, factorStart: number): number {
  let sum = 0;
  let factor = factorStart;
  for (let i = 0; i < base.length; i += 1) {
    sum += Number(base[i]) * factor;
    factor -= 1;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) {
    return false;
  }
  if (new Set(digits.split('')).size === 1) {
    return false;
  }

  const firstDigit = calculateVerifierDigit(digits.slice(0, 9), 10);
  const secondDigit = calculateVerifierDigit(digits.slice(0, 9) + firstDigit, 11);

  return digits[9] === String(firstDigit) && digits[10] === String(secondDigit);
}

export default function ClienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [photos, setPhotos] = useState<[string | null, string | null]>([null, null]);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) {
      return;
    }

    let cancelled = false;

    async function loadCliente() {
      setLoading(true);
      try {
        const cliente = await buscar(Number(id));
        if (!cancelled) {
          setNome(cliente.nome);
          setCpf(formatCpf(cliente.cpf));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCliente();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCpfError(null);
    setSubmitError(null);
    setPhotosError(null);

    if (!isValidCpf(cpf)) {
      setCpfError('CPF inválido');
      return;
    }

    if (!photos[0] || !photos[1]) {
      setPhotosError('Capture 2 fotos válidas antes de salvar');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        nome: nome.trim(),
        cpf: normalizeCpf(cpf),
        photosBase64: [photos[0], photos[1]] as [string, string],
      };

      if (isEdit && id) {
        await atualizar(Number(id), payload);
      } else {
        await criar(payload);
      }

      navigate('/admin/clientes');
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
        <Link to="/admin/clientes" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Voltar para clientes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          {isEdit ? 'Editar cliente' : 'Novo cliente'}
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
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            required
            placeholder="529.982.247-25"
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">Use um CPF válido (apenas números ou formatado).</p>
          {cpfError && <p className="mt-1 text-sm text-red-600">{cpfError}</p>}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-700">Fotos faciais</h2>
          <FaceCaptureWizard photos={photos} onChange={setPhotos} />
          {photosError && <p className="mt-1 text-sm text-red-600">{photosError}</p>}
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
