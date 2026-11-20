
import { useCallback, useEffect, useState } from 'react'
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

function IconeIndicador({ tipo }) {
  const propriedades = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const caminhos = {
    apartamentos: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 7h2M9 11h2M9 15h2M15 7h.01M15 11h.01M15 15h.01M10 21v-3h4v3" />
      </>
    ),
    moradores: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    solicitacoes: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    autorizacoes: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  }

  return <svg {...propriedades}>{caminhos[tipo]}</svg>
}

function IconeSair() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Painel() {
  const navigate = useNavigate()
  const usuario = api.obterUsuario()

  const [dashboard, setDashboard] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const nomePerfil = PERFIS[usuario?.tipo_usuario] || 'Usuário'
  const inicialUsuario = (usuario?.nome || 'U').charAt(0).toUpperCase()

  const carregarDashboard = useCallback(async () => {
    try {
      setCarregando(true)
      setErro('')

      const resposta = await api.get('/dashboard/master')
      setDashboard(resposta)
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar o dashboard.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDashboard()
  }, [carregarDashboard])

  function handleLogout() {
    api.limparSessao()
    navigate('/login', { replace: true })
  }

  function formatarAtualizacao(data) {
    if (!data) return ''

    const dataValida = new Date(data)

    if (Number.isNaN(dataValida.getTime())) return ''

    return dataValida.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const indicadores = dashboard?.indicadores

  const cards = [
    {
      tipo: 'apartamentos',
      titulo: 'Apartamentos ativos',
      valor: indicadores?.apartamentos_ativos ?? 0,
      descricao: 'Unidades cadastradas e ativas',
    },
    {
      tipo: 'moradores',
      titulo: 'Moradores ativos',
      valor: indicadores?.moradores_ativos ?? 0,
      descricao: 'Moradores com cadastro ativo',
    },
    {
      tipo: 'solicitacoes',
      titulo: 'Solicitações pendentes',
      valor: indicadores?.solicitacoes_pendentes ?? 0,
      descricao: 'Aguardando resposta dos moradores',
    },
    {
      tipo: 'autorizacoes',
      titulo: 'Autorizações vigentes',
      valor: indicadores?.autorizacoes_vigentes ?? 0,
      descricao: 'Autorizações válidas neste momento',
    },
  ]

  return (
    <main className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="painel-brand" aria-label="PalmCondo - início">
          <span className="painel-brand-icon">
            <LockIcon />
          </span>

          <span>
            Palm<span>Condo</span>
          </span>
        </a>

        <div className="painel-menu-label">
          MENU PRINCIPAL
        </div>

        <nav className="painel-navigation">
          <div className="painel-nav-item active">
            <span>▦</span>
            Visão geral
          </div>
        </nav>
      </aside>

      <section className="painel-main">
        <header className="painel-topbar">
          <div>
            <span className="painel-breadcrumb">
              PalmCondo / Área administrativa
            </span>

            <h1>Painel de controle</h1>
          </div>

          <div className="painel-topbar-user">
            <div className="painel-avatar">
              {inicialUsuario}
            </div>

            <span className="painel-topbar-user-name">
              {usuario?.nome || nomePerfil}
            </span>

            <button
              type="button"
              className="painel-logout-top"
              onClick={handleLogout}
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <IconeSair />
              <span>Sair</span>
            </button>
          </div>
        </header>

        <div className="painel-content">
          <section className="painel-welcome">
            <span className="painel-eyebrow">
              SEJA BEM-VINDO AO PALMCONDO
            </span>

            <h2>
              Olá, {usuario?.nome || 'administrador'}!
            </h2>

            <p>
              Acompanhe os indicadores e a situação do seu condomínio
              em um só lugar.
            </p>
          </section>

          <section className="painel-condominio">
            <div>
              <span className="painel-condominio-label">
                CONDOMÍNIO
              </span>

              <h2>
                {dashboard?.condominio?.nome || 'Carregando condomínio...'}
              </h2>

              {dashboard?.condominio && (
                <p>
                  {dashboard.condominio.cidade} - {dashboard.condominio.estado}
                </p>
              )}
            </div>

            {dashboard?.condominio && (
              <span
                className={`painel-status ${
                  dashboard.condominio.ativo ? 'ativo' : 'inativo'
                }`}
              >
                {dashboard.condominio.ativo ? 'Ativo' : 'Inativo'}
              </span>
            )}
          </section>

          <section className="painel-indicadores">
            <div className="painel-section-heading">
              <div>
                <h2>Resumo do condomínio</h2>
                <p>
                  Acompanhe abaixo os indicadores administrativos.
                </p>
              </div>

              <button
                type="button"
                className="painel-refresh"
                onClick={carregarDashboard}
                disabled={carregando}
              >
                ↻ {carregando ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>

            {erro && (
              <div className="painel-error" role="alert">
                <div>
                  <strong>
                    Não foi possível carregar os indicadores.
                  </strong>
                  <p>{erro}</p>
                </div>

                <button
                  type="button"
                  onClick={carregarDashboard}
                  disabled={carregando}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!erro && (
              <div className="painel-indicadores-grid">
                {cards.map((card) => (
                  <article
                    className="painel-indicador-card"
                    key={card.tipo}
                  >
                    <div className={`painel-indicador-icon ${card.tipo}`}>
                      <IconeIndicador tipo={card.tipo} />
                    </div>

                    <strong className="painel-indicador-titulo">
                      {card.titulo}
                    </strong>

                    <span className="painel-indicador-valor">
                      {carregando ? (
                        <span className="painel-loading">...</span>
                      ) : (
                        card.valor
                      )}
                    </span>

                    <span className="painel-indicador-descricao">
                      {card.descricao}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="painel-info-card">
            <div className="painel-info-icon">
              <LockIcon />
            </div>

            <div>
              <strong>Ambiente protegido</strong>
              <p>
                Seu acesso administrativo está protegido e as informações
                são exibidas conforme as permissões do seu perfil.
              </p>
            </div>
          </section>

          <div className="painel-atualizacao">
            {dashboard?.atualizado_em && !carregando && (
              <span>
                Última atualização: {formatarAtualizacao(dashboard.atualizado_em)}
              </span>
            )}
          </div>
        </div>

        <footer className="painel-footer">
          <span>PalmCondo © 2026</span>
          <span>Controle de acesso inteligente</span>
        </footer>
      </section>
    </main>
  )
}

export default Painel
