import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children, roles }) {
  const { usuario, rol, cargando } = useAuth()

  if (cargando) return <div className="auth-loading">Cargando sesión...</div>
  if (!usuario) return <Navigate to="/login" replace />

  if (roles?.length && !roles.includes(rol)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children
}

export default ProtectedRoute
