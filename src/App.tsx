import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import DashboardHome from './pages/Dashboard/DashboardHome';
import { NotificationProvider } from './context/NotificationContext';
import Laboratorio from './pages/Departamentos/laboratorio';
import Logistica from './pages/Departamentos/logistica';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              
              {/* Rutas del Dashboard */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <Dashboard />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardHome />} />
                <Route path="administracion" element={<AdminPanel />} />
                <Route path="calidad" element={<div className="p-4 md:p-6">Página de Calidad</div>} />
                <Route path="compras" element={<div className="p-4 md:p-6">Página de Compras</div>} />
                <Route path="informatica" element={<div className="p-4 md:p-6">Página de Informática</div>} />
                <Route path="internacional" element={<div className="p-4 md:p-6">Página Internacional</div>} />
                <Route path="logistica" element={<Logistica />} />
                <Route path="mantenimiento" element={<div className="p-4 md:p-6">Página de Mantenimiento</div>} />
                <Route path="tecnica" element={<div className="p-4 md:p-6">Página de Oficina Técnica</div>} />
                <Route path="prevencion" element={<div className="p-4 md:p-6">Página de Prevención</div>} />
                <Route path="rrhh" element={<div className="p-4 md:p-6">Página de RRHH</div>} />
                <Route path="laboratorio" element={<Laboratorio />} />
              </Route>

              {/* Ruta del Admin Panel */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;