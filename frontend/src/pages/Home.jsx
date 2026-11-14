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

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 14h3v3h-3zM20 14v2M17 20h4M20 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
          <a href="#como-funciona">Como funciona</a>
          <a href="#acessos">Acessos</a>
          <a className="header-login" href="#moradores">
            Entrar <ArrowIcon />
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
            <a className="primary-button" href="#acessos">
              Conheça os acessos <ArrowIcon />
            </a>
            <a className="secondary-button" href="#como-funciona">
              Como funciona
            </a>
          </div>

          <div className="hero-note">
            <ShieldIcon />
            <span>Organização e segurança em um só lugar.</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Ilustração conceitual do PalmCondo">
          <div className="visual-decoration decoration-one" />
          <div className="visual-decoration decoration-two" />

          <div className="visual-card">
            <div className="visual-card-header">
              <div className="visual-brand">
                <span className="mini-brand-icon"><ShieldIcon /></span>
                <div>
                  <strong>PalmCondo</strong>
                  <small>ACESSO INTELIGENTE</small>
                </div>
              </div>
              <span className="visual-menu">•••</span>
            </div>

            <div className="visual-highlight">
              <div className="visual-highlight-icon">
                <ShieldIcon />
              </div>
              <div>
                <span>GESTÃO DE ACESSO</span>
                <strong>Mais controle para seu condomínio</strong>
              </div>
            </div>

            <div className="visual-option">
              <div className="option-icon yellow-icon"><QrIcon /></div>
              <div>
                <strong>Visitantes</strong>
                <small>Solicitação de acesso por QR Code</small>
              </div>
              <ArrowIcon />
            </div>

            <div className="visual-option">
              <div className="option-icon dark-icon"><UsersIcon /></div>
              <div>
                <strong>Moradores e equipe</strong>
                <small>Acesso à área autenticada</small>
              </div>
              <ArrowIcon />
            </div>

            <div className="security-label">
              <span className="security-icon"><ShieldIcon /></span>
              <div>
                <strong>Segurança digital</strong>
                <small>Controle organizado de acessos</small>
              </div>
            </div>

            <div className="visual-card-footer">
              <span className="footer-dot" />
              SIMPLES · ORGANIZADO · SEGURO
            </div>
          </div>
        </div>
      </section>

      <section className="access-section" id="acessos">
        <div className="section-heading">
          <span>COMECE POR AQUI</span>
          <h2>Como deseja acessar?</h2>
          <p>Escolha a opção correspondente ao seu perfil.</p>
        </div>

        <div className="access-grid">
          <article className="access-card visitor-card" id="visitantes">
            <div className="access-card-icon"><QrIcon /></div>
            <span className="card-kicker">ACESSO PÚBLICO</span>
            <h3>Sou visitante</h3>
            <p>
              Utilize o QR Code disponibilizado pelo condomínio
              para iniciar sua solicitação de acesso.
            </p>
            <a href="#visitantes" className="card-link">
              Acessar como visitante <ArrowIcon />
            </a>
          </article>

          <article className="access-card resident-card" id="moradores">
            <div className="access-card-icon"><UsersIcon /></div>
            <span className="card-kicker">ÁREA RESTRITA</span>
            <h3>Sou morador ou colaborador</h3>
            <p>
              Entre com suas credenciais para acessar as
              funcionalidades disponíveis para seu perfil.
            </p>
            <a href="#moradores" className="card-link">
              Acessar minha conta <ArrowIcon />
            </a>
          </article>
        </div>
      </section>

      <section className="about-section" id="como-funciona">
        <div className="about-icon"><ShieldIcon /></div>
        <div>
          <span>PALMCONDO</span>
          <h2>Mais organização para o acesso. Mais tranquilidade para todos.</h2>
          <p>
            Uma plataforma desenvolvida para facilitar a gestão
            de entradas e autorizações em condomínios residenciais.
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
