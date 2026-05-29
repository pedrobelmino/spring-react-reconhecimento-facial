import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { refreshCsrfToken } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void refreshCsrfToken();
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-gray-900">Admin</span>
            <Link
              to="/admin/clientes"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Clientes
            </Link>
            <Link
              to="/admin/clientes/novo"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Novo cliente
            </Link>
            <a
              href="/entrada"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Tela de entrada ↗
            </a>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-gray-600">{user.username}</span>}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
