
import '../App.css'

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4" y="10" width="16" height="11" rx="2"
        stroke="currentColor" strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="18" rx="2"
        stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4V2h6v2M8 11h8M8 15h8"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v5h5M12 7v5l3 2"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2"
        stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 6h2M14 6h2M9 10h2M14 10h2M9 14h2M14 14h2M10 22v-4h4v4"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" />
    </svg>
  )
}

function App() {
  return (
    <main className="palmcondo-app">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="PalmCondo - início">
          <span className="brand-icon">
            <LockIcon />
          </span>
          <span>Palm<span>Condo</span></span>
        </a>

        <nav className="header-navigation" aria-label="Navegação principal">
          <a className="header-login" href="/login">
            Entrar
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </nav>
      </header>

      <section className="hero-section" id="inicio">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            CONTROLE DE ACESSO INTELIGENTE
          </div>

          <h1>
            Seu condomínio.
            <br />
            Mais <span>segurança.</span>
            <br />
            Mais praticidade.
          </h1>

          <p className="hero-description">
            Tecnologia para simplificar o controle de acesso,
            organizar visitantes e tornar o dia a dia do condomínio
            mais seguro e eficiente.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="/como-funciona">
              Conheça o PalmCondo
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6"
                  stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="hero-note">
            <ShieldIcon />
            <span>Organização e segurança em um só lugar.</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Apresentação das funcionalidades do PalmCondo">
          <div className="visual-decoration decoration-one" />
          <div className="visual-decoration decoration-two" />

          <div className="visual-card">
            <div className="visual-highlight">
              <div>
                <span>CONTROLE INTELIGENTE</span>
                <strong>Seu condomínio mais organizado e seguro</strong>
              </div>
            </div>

            <div className="visual-features-grid">
              <div className="visual-feature">
                <span className="feature-icon dark-icon">
                  <UsersIcon />
                </span>
                <strong>Moradores</strong>
                <small>Cadastro e gestão</small>
              </div>

              <div className="visual-feature">
                <span className="feature-icon yellow-icon">
                  <ClipboardIcon />
                </span>
                <strong>Autorizações</strong>
                <small>Controle de permissões</small>
              </div>

              <div className="visual-feature">
                <span className="feature-icon yellow-icon">
                  <HistoryIcon />
                </span>
                <strong>Histórico</strong>
                <small>Registros de acesso</small>
              </div>

              <div className="visual-feature">
                <span className="feature-icon dark-icon">
                  <BuildingIcon />
                </span>
                <strong>Administração</strong>
                <small>Gestão do condomínio</small>
              </div>
            </div>

            <div className="visual-card-footer">
              <span className="footer-dot" />
              ORGANIZAÇÃO · CONTROLE · SEGURANÇA
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-icon">
          <ShieldIcon />
        </div>
        <div>
          <span>PALMCONDO</span>
          <h2>
            Mais organização para o acesso.
            Mais tranquilidade para todos.
          </h2>
          <p>
            Uma plataforma desenvolvida para facilitar a gestão
            de entradas, saídas e autorizações em condomínios residenciais.
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <a className="footer-brand" href="#inicio">PalmCondo</a>
        <span>Controle de acesso inteligente.</span>
        <span>© 2026 PalmCondo</span>
      </footer>
    </main>
  )
}

export default App
