import { Routes, Route } from 'react-router-dom'
import Inicio from './components/home/Inicio'
import Login from './components/auth/Login'
import Registro from './components/auth/Registro'
import RecuperarPassword from './components/auth/RecuperarPassword'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminDashboard from './components/admin/AdminDashboard'
import ConductorDashboard from './components/conductor/ConductorDashboard'
import ClienteDashboard from './components/cliente/ClienteDashboard'
import CrearcuentaConductor from './components/auth/CrearcuentaConductor'

function Denied() {
  return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <div className="login-icon">
          <i className="bi bi-shield-x" />
        </div>

        <p className="auth-eyebrow">
          BULKWAY · OPERACIÓN SEGURA
        </p>

        <h1>
          Acceso no permitido
        </h1>

        <p className="auth-copy">
          Tu cuenta no tiene permisos para entrar a este panel.
        </p>

        <a
          className="btn btn-purple btn-full"
          href="/login"
        >
          Volver al acceso
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Inicio />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/registro"
        element={<Registro />}
      />

      <Route
        path="/recuperar"
        element={<RecuperarPassword />}
      />

      <Route
        path="/acceso-denegado"
        element={<Denied />}
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['administrador']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/conductor"
        element={
          <ProtectedRoute roles={['conductor']}>
            <ConductorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cliente"
        element={
          <ProtectedRoute roles={['cliente']}>
            <ClienteDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/crear-cuenta-conductor"
        element={<CrearcuentaConductor />}
      />
    </Routes>
  )
}

export default App