
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './Login.css'

const CHAVE_MENSAGEM_ACESSO = 'palmcondo_mensagem_acesso'

function obterRotaPorPerfil(tipoUsuario) {
  const rotas = {
    MASTER: '/painel',
    SINDICO: '/painel',
    MORADOR: '/morador',
  }

  return rotas[tipoUsuario] || null
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ aberto }) {
  return aberto ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m3 3 18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const mensagem = sessionStorage.getItem(CHAVE_MENSAGEM_ACESSO)

    if (mensagem) {
      setErro(mensagem)
      sessionStorage.removeItem(CHAVE_MENSAGEM_ACESSO)
    } else if (location.state?.erroAcesso) {
      setErro(location.state.erroAcesso)
    }
  }, [location.state])

  useEffect(() => {
    if (!erro) return

    const temporizador = setTimeout(() => {
      setErro('')
    }, 10000)

    return () => clearTimeout(temporizador)
  }, [erro])

  useEffect(() => {
    const token = api.obterToken()
    const usuario = api.obterUsuario()

    if (token && usuario) {
      const rota = obterRotaPorPerfil(usuario.tipo_usuario)

      if (rota) {
        navigate(rota, { replace: true })
        return
      }

      api.limparSessao()
      setErro(
        'Seu perfil ainda não possui acesso aos painéis disponíveis.'
      )
      return
    }

    if (token || usuario) {
      api.limparSessao()
    }
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()

    if (carregando) return

    setErro('')

    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.')
      return
    }

    try {
      setCarregando(true)

      const resposta = await api.post('/auth/login', {
        email: email.trim(),
        senha,
      })

      if (!resposta?.token || !resposta?.usuario) {
        throw new Error('Resposta de autenticação inválida.')
      }

      const rota = obterRotaPorPerfil(
        resposta.usuario.tipo_usuario
      )

      if (!rota) {
        throw new Error(
          'Seu perfil ainda não possui acesso aos painéis disponíveis.'
        )
      }

      api.salvarSessao(resposta.token, resposta.usuario)

      navigate(rota, { replace: true })
    } catch (error) {
      setErro(error.message || 'Não foi possível realizar o login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="palmcondo-app login-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="PalmCondo - início">
          <span className="brand-icon">
            <LockIcon />
          </span>
          <span>
            Palm<span>Condo</span>
          </span>
        </a>

        <span className="login-header-label">ÁREA RESTRITA</span>
      </header>

      <section className="login-container">
        <div className="login-heading">
          <span className="login-eyebrow">ACESSO AO SISTEMA</span>
          <h1>Bem-vindo de volta!</h1>
          <p>
            Entre com suas credenciais para acessar
            sua conta no PalmCondo.
          </p>
        </div>

        <div className="login-card">
          <div className="login-card-icon">
            <LockIcon />
          </div>

          <h2>Entrar na sua conta</h2>

          <p className="login-card-description">
            Informe seus dados de acesso abaixo.
          </p>

          {erro && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px',
                marginBottom: '20px',
                border: '1px solid #dc3545',
                borderRadius: '8px',
                backgroundColor: '#f8d7da',
                color: '#842029',
                fontSize: '14px',
                lineHeight: '1.5',
                textAlign: 'left',
              }}
            >
              <strong style={{ flexShrink: 0 }}>!</strong>
              <span>{erro}</span>
              <button
                type="button"
                onClick={() => setErro('')}
                aria-label="Fechar mensagem"
                style={{
                  marginLeft: 'auto',
                  border: 'none',
                  background: 'transparent',
                  color: '#842029',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                E-mail
              </label>

              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Digite seu e-mail"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErro('')
                }}
                required
                disabled={carregando}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="senha" className="form-label">
                Senha
              </label>

              <div className="login-password-wrapper">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  id="senha"
                  className="form-control"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(event) => {
                    setSenha(event.target.value)
                    setErro('')
                  }}
                  required
                  disabled={carregando}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={carregando}
                >
                  <EyeIcon aberto={mostrarSenha} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-security">
            <LockIcon />
            <span>Ambiente de acesso protegido.</span>
          </div>
        </div>

        <a href="/" className="login-back-link">
          Voltar para a página inicial
        </a>
      </section>

      <footer className="site-footer">
        <a className="footer-brand" href="/">PalmCondo</a>
        <span>Controle de acesso inteligente.</span>
        <span>© 2026 PalmCondo</span>
      </footer>
    </main>
  )
}

export default Login
