
  import { useNavigate } from 'react-router-dom'
  import { api } from '../services/api'
  import './Painel.css'

  const PERFIS = {
    MASTER: 'Administrador Master',
    SINDICO: 'Síndico',
    MORADOR: 'Morador',
  }

  function LockIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="16" height="11" rx="2"
          stroke="currentColor" strokeWidth="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  function Painel() {
    const navigate = useNavigate()
    const usuario = api.obterUsuario()

    function handleLogout() {
      api.limparSessao()
      navigate('/login', { replace: true })
    }

    const nomePerfil = PERFIS[usuario?.tipo_usuario] || 'Usuário'

    return (
      <main className="painel-layout">
        <aside className="painel-sidebar">
          <a href="/" className="painel-brand">
            <span className="painel-brand-icon">
              <LockIcon />
            </span>
            <span>Palm<span>Condo</span></span>
          </a>

          <div className="painel-menu-label">MENU PRINCIPAL</div>

          <nav className="painel-navigation">
            <div className="painel-nav-item active">
              <span>▦</span>
              Visão geral
            </div>
          </nav>

          <div className="painel-sidebar-footer">
            <div className="painel-user-avatar">
              {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="painel-user-info">
              <strong>{usuario?.nome || 'Usuário'}</strong>
              <span>{nomePerfil}</span>
            </div>

            <button
              type="button"
              className="painel-logout"
              onClick={handleLogout}
              title="Sair do sistema"
              aria-label="Sair do sistema"
            >
              ↪
            </button>
          </div>
        </aside>

        <section className="painel-main">
          <header className="painel-topbar">
            <div>
              <span className="painel-topbar-label">ÁREA ADMINISTRATIVA</span>
              <h1>Painel de controle</h1>
            </div>

            <div className="painel-profile">
              <span className="painel-profile-dot" />
              {nomePerfil}
            </div>
          </header>

          <div className="painel-content">
            <div className="painel-welcome">
              <span className="painel-eyebrow">BEM-VINDO AO PALMCONDO</span>
              <h2>Olá, {usuario?.nome || 'usuário'}!</h2>
              <p>
                Aqui você poderá acompanhar e gerenciar as funcionalidades
                disponíveis para seu perfil de acesso.
              </p>
            </div>

            <div className="painel-section-heading">
              <h2>Visão geral</h2>
              <span>Seu ambiente de gestão</span>
            </div>

            <div className="painel-info-card">
              <div className="painel-info-icon">
                <LockIcon />
              </div>

              <div>
                <strong>Ambiente autenticado</strong>
                <p>
                  Seu acesso está protegido e as funcionalidades são
                  disponibilizadas conforme seu perfil.
                </p>
              </div>
            </div>

            <div className="painel-coming-soon">
              <span>EM DESENVOLVIMENTO</span>
              <h3>Seu painel está sendo preparado.</h3>
              <p>
                Em breve, os módulos de gestão e controle de acesso
                estarão disponíveis neste ambiente.
              </p>
            </div>
          </div>

          <footer className="painel-footer">
            <span>PalmCondo</span>
            <span>Controle de acesso inteligente. © 2026</span>
          </footer>
        </section>
      </main>
    )
  }

  export default Painel
