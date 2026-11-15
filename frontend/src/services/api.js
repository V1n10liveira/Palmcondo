
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

const TOKEN_KEY = 'palmcondo_token'
const USUARIO_KEY = 'palmcondo_usuario'

function obterToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

function obterUsuario() {
  const usuario = sessionStorage.getItem(USUARIO_KEY)

  if (!usuario) {
    return null
  }

  try {
    return JSON.parse(usuario)
  } catch {
    sessionStorage.removeItem(USUARIO_KEY)
    return null
  }
}

function salvarSessao(token, usuario) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
}

function limparSessao() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USUARIO_KEY)
}

async function requisicao(endpoint, options = {}) {
  if (!API_URL) {
    throw new Error('A URL da API não está configurada.')
  }

  try {
    const token = obterToken()

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const contentType = response.headers.get('content-type') || ''

    let dados = null

    if (contentType.includes('application/json')) {
      dados = await response.json()
    } else {
      dados = await response.text()
    }

    if (!response.ok) {
      const mensagem =
        dados?.mensagem ||
        dados?.erro ||
        (typeof dados === 'string' && dados.trim()) ||
        'Erro ao comunicar com o servidor.'

      throw new Error(mensagem)
    }

    return dados
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Não foi possível conectar ao servidor. Tente novamente.',
        { cause: error }
      )
    }

    throw error
  }
}

export const api = {
  get(endpoint) {
    return requisicao(endpoint)
  },

  post(endpoint, dados) {
    return requisicao(endpoint, {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  },

  put(endpoint, dados) {
    return requisicao(endpoint, {
      method: 'PUT',
      body: JSON.stringify(dados),
    })
  },

  delete(endpoint) {
    return requisicao(endpoint, {
      method: 'DELETE',
    })
  },

  salvarSessao,
  obterToken,
  obterUsuario,
  limparSessao,
}
