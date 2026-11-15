
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './Login.css'

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

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const token = api.obterToken()
    const usuario = api.obterUsuario()

    if (token && usuario) {
      navigate('/painel', { replace: true })
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

      api.salvarSessao(resposta.token, resposta.usuario)

      navigate('/painel', { replace: true })
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
            <div className="alert alert-danger" role="alert">
              {erro}
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
