import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ClienteFormPage from './routes/ClienteFormPage';
import ClienteListPage from './routes/ClienteListPage';
import EntradaPage from './routes/EntradaPage';
import LoginPage from './routes/LoginPage';
import AcompanhamentoFormPage from './routes/AcompanhamentoFormPage';
import AcompanhamentoListPage from './routes/AcompanhamentoListPage';
import MaquinaFormPage from './routes/MaquinaFormPage';
import MaquinaListPage from './routes/MaquinaListPage';

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4">
      <h1 className="text-3xl font-semibold text-gray-900">Academia Face Access</h1>
      <p className="max-w-md text-center text-gray-600">
        Cadastre clientes no painel admin e teste o reconhecimento facial na tela de entrada.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/login"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Painel admin
        </Link>
        <Link
          to="/entrada"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Tela de entrada
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/entrada" element={<EntradaPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/clientes" element={<ClienteListPage />} />
            <Route path="/admin/clientes/novo" element={<ClienteFormPage />} />
            <Route path="/admin/clientes/:id/editar" element={<ClienteFormPage />} />
            <Route path="/admin/maquinas" element={<MaquinaListPage />} />
            <Route path="/admin/maquinas/novo" element={<MaquinaFormPage />} />
            <Route path="/admin/maquinas/:id/editar" element={<MaquinaFormPage />} />
            <Route path="/admin/acompanhamentos" element={<AcompanhamentoListPage />} />
            <Route path="/admin/acompanhamentos/novo" element={<AcompanhamentoFormPage />} />
            <Route path="/admin/acompanhamentos/:id/editar" element={<AcompanhamentoFormPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
