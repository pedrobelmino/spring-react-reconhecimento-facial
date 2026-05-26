import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ClienteFormPage from './routes/ClienteFormPage';
import ClienteListPage from './routes/ClienteListPage';
import EntradaPage from './routes/EntradaPage';
import LoginPage from './routes/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/entrada" element={<EntradaPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/clientes" element={<ClienteListPage />} />
            <Route path="/admin/clientes/novo" element={<ClienteFormPage />} />
            <Route path="/admin/clientes/:id/editar" element={<ClienteFormPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
