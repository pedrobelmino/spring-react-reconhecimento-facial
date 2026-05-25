import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ClienteListPage from './routes/ClienteListPage';
import EntradaPage from './routes/EntradaPage';
import LoginPage from './routes/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/clientes" element={<ClienteListPage />} />
        <Route path="/entrada" element={<EntradaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
