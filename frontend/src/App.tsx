import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
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
          <Route path="/admin/clientes" element={<ClienteListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
