
import { Navigate, Outlet } from 'react-router-dom'
import { api } from '../services/api'

const PERFIS_AUTORIZADOS = ['MASTER', 'SINDICO', 'MORADOR']
const CHAVE_MENSAGEM_ACESSO = 'palmcondo_mensagem_acesso'

function ProtectedRoute() {
  const token = api.obterToken()
  const usuario = api.obterUsuario()

  if (!token || !usuario) {
    api.limparSessao()
    return <Navigate to="/login" replace />
  }

  if (!PERFIS_AUTORIZADOS.includes(usuario.tipo_usuario)) {
    sessionStorage.setItem(
      CHAVE_MENSAGEM_ACESSO,
      'Seu perfil não possui permissão para acessar o painel administrativo.'
    )

    api.limparSessao()

    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
