
import { Navigate, Outlet } from 'react-router-dom'
import { api } from '../services/api'

const CHAVE_MENSAGEM_ACESSO = 'palmcondo_mensagem_acesso'

function ProtectedRoute({ perfisPermitidos = [] }) {
  const token = api.obterToken()
  const usuario = api.obterUsuario()

  if (!token || !usuario) {
    api.limparSessao()
    return <Navigate to="/login" replace />
  }

  const perfil = usuario.tipo_usuario

  // COLABORADOR ainda não faz parte da primeira versão.
  if (!['MASTER', 'SINDICO', 'MORADOR'].includes(perfil)) {
    sessionStorage.setItem(
      CHAVE_MENSAGEM_ACESSO,
      'Seu perfil ainda não possui acesso aos painéis disponíveis.'
    )

    api.limparSessao()

    return <Navigate to="/login" replace />
  }

  // Impede acesso a ambientes destinados a outros perfis.
  if (!perfisPermitidos.includes(perfil)) {
    if (perfil === 'MORADOR') {
      return <Navigate to="/morador" replace />
    }

    return <Navigate to="/painel" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
