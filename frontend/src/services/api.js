
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

async function requisicao(endpoint, options = {}) {
  if (!API_URL) {
    throw new Error('A URL da API não está configurada.')
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
}
