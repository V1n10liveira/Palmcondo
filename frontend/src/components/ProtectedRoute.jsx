import { Navigate, Outlet } from 'react-router-dom'
import { api } from '../services/api'

function ProtectedRoute() {
  const token = api.obterToken()
  const usuario = api.obterUsuario()

  if (!token || !usuario) {
    api.limparSessao()
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute