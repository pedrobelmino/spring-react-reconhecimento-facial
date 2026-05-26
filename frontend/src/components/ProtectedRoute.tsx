import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
