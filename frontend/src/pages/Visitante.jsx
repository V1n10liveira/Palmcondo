
import '../App.css'
import './Visitante.css'

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

const apartamentos = [
  { id: 1, bloco: 'A', numero: '101' },
  { id: 2, bloco: 'A', numero: '102' },
  { id: 3, bloco: 'A', numero: '103' },
  { id: 4, bloco: 'A', numero: '104' },
  { id: 5, bloco: 'A', numero: '105' },
  { id: 6, bloco: 'A', numero: '106' },
  { id: 7, bloco: 'A', numero: '107' },
  { id: 8, bloco: 'A', numero: '108' },
  { id: 9, bloco: 'A', numero: '109' },
  { id: 10, bloco: 'A', numero: '110' },
]

function Visitante() {
  function handleSubmit(event) {
    event.preventDefault()
  }

  return (
    <main className="palmcondo-app visitante-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="PalmCondo">
          <span className="brand-icon">
            <LockIcon />
          </span>

          <span>
            Palm<span>Condo</span>
          </span>
        </a>

        <span className="visitante-header-label">
          ACESSO PÚBLICO
        </span>
      </header>

      <section className="visitante-container">
        <div className="visitante-heading">
          <span className="visitante-eyebrow">
            SOLICITAÇÃO DE ENTRADA
          </span>

          <h1>Solicitação de acesso</h1>

          <p>
            Informe seus dados para solicitar sua entrada
            no condomínio.
          </p>
        </div>

        <div className="visitante-card">
          <div className="condominio-identificacao">
            <span>CONDOMÍNIO</span>

            <strong>Ideal Erechim</strong>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="apartamento" className="form-label">
                Apartamento
              </label>

              <select
                id="apartamento"
                name="apartamento"
                className="form-select"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Selecione o apartamento
                </option>

                {apartamentos.map((apartamento) => (
                  <option key={apartamento.id} value={apartamento.id}>
                    Bloco {apartamento.bloco} - Apto {apartamento.numero}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="nome" className="form-label">
                Nome completo
              </label>

              <input
                type="text"
                id="nome"
                name="nome"
                className="form-control"
                placeholder="Digite seu nome completo"
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="cpf" className="form-label">
                CPF
              </label>

              <input
                type="text"
                id="cpf"
                name="cpf"
                className="form-control"
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="mensagem" className="form-label">
                Mensagem (opcional)
              </label>

              <textarea
                id="mensagem"
                name="mensagem"
                className="form-control"
                rows="3"
                maxLength={100}
                placeholder="Digite uma mensagem (até 100 caracteres)"
              />

              <div className="form-text">
                Máximo de 100 caracteres.
              </div>
            </div>

            <button
              type="submit"
              className="visitante-button"
            >
              Enviar solicitação
            </button>
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <a className="footer-brand" href="/">
          PalmCondo
        </a>

        <span>Controle de acesso inteligente.</span>

        <span>© 2026 PalmCondo</span>
      </footer>
    </main>
  )
}

export default Visitante
