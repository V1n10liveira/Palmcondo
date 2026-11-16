
import { Link } from 'react-router-dom'
import './ComoFunciona.css'

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="7" r="4"
        stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="18" rx="2"
        stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4V2h6v2M8 11h8M8 15h8"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.71"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2
        19.8 19.8 0 0 1-8.63-3.07
        19.5 19.5 0 0 1-6-6
        19.8 19.8 0 0 1-3.07-8.67
        A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72
        c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91
        a16 16 0 0 0 6 6l1.27-1.27
        a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7
        A2 2 0 0 1 22 16.92Z"
        stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"
        stroke="currentColor" strokeWidth="1.8" />
      <path d="m22 7-10 6L2 7"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ComoFunciona() {
  return (
    <main className="como-page">
      <header className="como-header">
        <Link to="/" className="como-brand" aria-label="PalmCondo - voltar ao início">
          <span className="como-brand-icon">
            <LockIcon />
          </span>
          <span>Palm<span>Condo</span></span>
        </Link>

        <Link to="/login" className="como-login">
          Entrar <ArrowIcon />
        </Link>
      </header>

      <section className="como-hero">
        <div className="como-eyebrow">
          <span />
          GESTÃO DIGITAL PARA CONDOMÍNIOS
        </div>

        <h1>
          Gestão de acessos
          <br />
          mais <span>simples e organizada.</span>
        </h1>

        <p>
          O PalmCondo é uma plataforma digital desenvolvida para
          organizar moradores, visitantes, prestadores de serviços
          e autorizações de acesso em condomínios residenciais.
          Mais praticidade para os moradores e mais organização
          para a administração.
        </p>
      </section>

      <section className="como-modules">
        <div className="como-section-heading">
          <span className="como-section-label">RECURSOS DA PLATAFORMA</span>
          <h2>Conheça os principais módulos</h2>
          <p>
            Uma estrutura organizada para apoiar a administração
            e facilitar a rotina dos moradores.
          </p>
        </div>

        <div className="como-grid">
          <article className="como-card">
            <div className="como-card-icon dark">
              <UsersIcon />
            </div>
            <h3>Gestão de moradores</h3>
            <p>
              Organização dos moradores e seus vínculos com
              apartamentos e unidades do condomínio.
            </p>
          </article>

          <article className="como-card">
            <div className="como-card-icon yellow">
              <ClipboardIcon />
            </div>
            <h3>Autorizações de acesso</h3>
            <p>
              Cadastro de visitantes e prestadores, com definição
              de períodos e condições de autorização.
            </p>
          </article>

          <article className="como-card">
            <div className="como-card-icon yellow">
              <LinkIcon />
            </div>
            <h3>Acesso por QR Code e link</h3>
            <p>
              Identificação do condomínio pelo QR Code público
              e possibilidade de acesso por link individual
              de autorização.
            </p>
          </article>

          <article className="como-card">
            <div className="como-card-icon dark">
              <HistoryIcon />
            </div>
            <h3>Histórico de acessos</h3>
            <p>
              Estrutura para registrar entradas e saídas,
              consultar movimentações e acompanhar acessos em aberto.
            </p>
          </article>

          <article className="como-card">
            <div className="como-card-icon yellow">
              <BuildingIcon />
            </div>
            <h3>Administração condominial</h3>
            <p>
              Gestão de condomínios, apartamentos, cadastros
              e permissões conforme o perfil do usuário.
            </p>
          </article>

          <article className="como-card">
            <div className="como-card-icon dark">
              <ShieldIcon />
            </div>
            <h3>Segurança e permissões</h3>
            <p>
              Acesso às funcionalidades de acordo com o perfil
              e as permissões estabelecidas no sistema.
            </p>
          </article>
        </div>
      </section>

      <section className="como-flow">
        <div className="como-section-heading">
          <span className="como-section-label">COMO FUNCIONA</span>
          <h2>Uma rotina mais simples e organizada</h2>
        </div>

        <div className="como-flow-grid">
          <article className="como-flow-step">
            <span className="como-step-number">01</span>
            <h3>Cadastro</h3>
            <p>
              O condomínio e seus apartamentos são organizados
              na plataforma, com os respectivos moradores.
            </p>
          </article>

          <article className="como-flow-step">
            <span className="como-step-number">02</span>
            <h3>Autorização</h3>
            <p>
              O morador registra os dados da pessoa e define
              o período e as condições de acesso.
            </p>
          </article>

          <article className="como-flow-step">
            <span className="como-step-number">03</span>
            <h3>Validação</h3>
            <p>
              A autorização pode ser consultada e validada
              conforme as regras e o período estabelecidos.
            </p>
          </article>

          <article className="como-flow-step">
            <span className="como-step-number">04</span>
            <h3>Organização</h3>
            <p>
              As movimentações registradas podem compor
              o histórico de acessos do condomínio.
            </p>
          </article>
        </div>
      </section>

      <section className="como-custom">
        <div className="como-custom-icon">
          <BuildingIcon />
        </div>
        <div className="como-custom-content">
          <span>UMA SOLUÇÃO FLEXÍVEL</span>
          <h2>Cada condomínio tem suas particularidades. O sistema também pode ter.</h2>
          <p>
            O PalmCondo foi pensado para permitir evolução e adaptação.
            Podemos avaliar necessidades específicas de cada cliente
            e estudar personalizações de funcionalidades, fluxos
            e apresentação, conforme o projeto contratado.
          </p>
        </div>
      </section>

      <section className="como-contact">
        <div className="como-contact-content">
          <span className="como-section-label">CENTRAL DE VENDAS</span>
          <h2>Ficou interessado?</h2>
          <p>
            Agende uma reunião de apresentação e conheça melhor
            os recursos da plataforma e como ela pode contribuir
            para a organização do seu condomínio.
          </p>

          <div className="como-contact-actions">
            <a href="tel:+5551999999999" className="como-contact-item">
              <span className="como-contact-icon">
                <PhoneIcon />
              </span>
              <span>
                <small>Fale com nossa equipe</small>
                <strong>(51) 99999-9999</strong>
              </span>
            </a>

            <a href="mailto:vendas@palmcondo.com.br" className="como-contact-item">
              <span className="como-contact-icon">
                <MailIcon />
              </span>
              <span>
                <small>Envie sua mensagem</small>
                <strong>vendas@palmcondo.com.br</strong>
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="como-final">
        <h2>PalmCondo. Organização e controle para o seu condomínio.</h2>
        <p>
          Conheça a plataforma e acompanhe a evolução de uma nova
          forma de organizar os acessos condominiais.
        </p>
        <Link to="/" className="como-final-button">
          Voltar para o início <ArrowIcon />
        </Link>
      </section>

      <footer className="como-footer">
        <Link to="/" className="como-footer-brand">PalmCondo</Link>
        <span>Controle de acesso inteligente.</span>
        <span>© 2026 PalmCondo</span>
      </footer>
    </main>
  )
}

export default ComoFunciona
