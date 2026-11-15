
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './Morador.css'

const secoes = [
  {
    id: 'inicio',
    nome: 'Visão geral',
    icone: '⌂',
    descricao: 'Resumo da sua área de morador.'
  },
  {
    id: 'autorizacoes',
    nome: 'Minhas autorizações',
    icone: '✓',
    descricao: 'Consulte e acompanhe suas autorizações de acesso.'
  },
  {
    id: 'visitantes',
    nome: 'Visitantes',
    icone: '♙',
    descricao: 'Gerencie os visitantes vinculados a você.'
  },
  {
    id: 'prestadores',
    nome: 'Prestadores',
    icone: '⚒',
    descricao: 'Consulte e gerencie seus prestadores de serviço.'
  },
  {
    id: 'historico',
    nome: 'Histórico de acessos',
    icone: '◷',
    descricao: 'Acompanhe o histórico de entradas e saídas.'
  },
  {
    id: 'perfil',
    nome: 'Meu perfil',
    icone: '◎',
    descricao: 'Consulte seus dados cadastrais.'
  }
]

const statusAutorizacao = {
  PENDENTE: {
    nome: 'Pendente',
    classe: 'pendente'
  },
  ATIVA: {
    nome: 'Ativa',
    classe: 'ativa'
  },
  UTILIZADA: {
    nome: 'Utilizada',
    classe: 'utilizada'
  },
  EXPIRADA: {
    nome: 'Expirada',
    classe: 'expirada'
  },
  CANCELADA: {
    nome: 'Cancelada',
    classe: 'cancelada'
  },
  BLOQUEADA: {
    nome: 'Bloqueada',
    classe: 'bloqueada'
  }
}

function formatarData(data) {
  if (!data) return 'Não informada'

  const dataObj = new Date(data)

  if (Number.isNaN(dataObj.getTime())) {
    return 'Data inválida'
  }

  return dataObj.toLocaleDateString('pt-BR', {
    timeZone: 'UTC'
  })
}

function formatarDataHora(data) {
  if (!data) return 'Não informada'

  const dataObj = new Date(data)

  if (Number.isNaN(dataObj.getTime())) {
    return 'Data inválida'
  }

  return dataObj.toLocaleString('pt-BR')
}

function formatarTipoPessoa(tipo) {
  const tipos = {
    VISITANTE: 'Visitante',
    PRESTADOR: 'Prestador'
  }

  return tipos[tipo] || tipo || 'Não informado'
}

function Morador() {
  const navigate = useNavigate()
  const usuario = api.obterUsuario()

  const [secaoAtiva, setSecaoAtiva] = useState('inicio')

  const [autorizacoes, setAutorizacoes] = useState([])
  const [carregandoAutorizacoes, setCarregandoAutorizacoes] = useState(false)
  const [erroAutorizacoes, setErroAutorizacoes] = useState('')

  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false)
  const [erroSolicitacoes, setErroSolicitacoes] = useState('')
  const [mensagemSolicitacao, setMensagemSolicitacao] = useState('')
  const [solicitacaoEmProcessamento, setSolicitacaoEmProcessamento] = useState(null)

  const secaoAtual = secoes.find(
    (secao) => secao.id === secaoAtiva
  )

  const carregarAutorizacoes = useCallback(async () => {
    setCarregandoAutorizacoes(true)
    setErroAutorizacoes('')

    try {
      const resposta = await api.get('/autorizacoes')

      setAutorizacoes(
        Array.isArray(resposta?.autorizacoes)
          ? resposta.autorizacoes
          : []
      )
    } catch (error) {
      setErroAutorizacoes(
        error.message || 'Não foi possível carregar as autorizações.'
      )
    } finally {
      setCarregandoAutorizacoes(false)
    }
  }, [])

  const carregarSolicitacoes = useCallback(async () => {
    setCarregandoSolicitacoes(true)
    setErroSolicitacoes('')

    try {
      const resposta = await api.get('/visitantes/solicitacoes')

      setSolicitacoes(
        Array.isArray(resposta?.solicitacoes)
          ? resposta.solicitacoes
          : []
      )
    } catch (error) {
      setErroSolicitacoes(
        error.message || 'Não foi possível carregar as solicitações.'
      )
    } finally {
      setCarregandoSolicitacoes(false)
    }
  }, [])

  useEffect(() => {
    if (secaoAtiva === 'autorizacoes') {
      carregarAutorizacoes()
    }

    if (secaoAtiva === 'visitantes') {
      setMensagemSolicitacao('')
      carregarSolicitacoes()
    }
  }, [
    secaoAtiva,
    carregarAutorizacoes,
    carregarSolicitacoes
  ])

  function handleLogout() {
    api.limparSessao()
    navigate('/login', { replace: true })
  }

  function navegarPara(secao) {
    setSecaoAtiva(secao)
  }

  async function responderSolicitacao(solicitacao, status) {
    const acao = status === 'AUTORIZADA' ? 'aprovar' : 'recusar'

    const confirmado = window.confirm(
      `Tem certeza de que deseja ${acao} a solicitação de ${solicitacao.nome}?`
    )

    if (!confirmado) return

    setSolicitacaoEmProcessamento(solicitacao.id)
    setErroSolicitacoes('')
    setMensagemSolicitacao('')

    try {
      const resposta = await api.patch(
        `/visitantes/solicitacoes/${solicitacao.id}/resposta`,
        { status }
      )

      setMensagemSolicitacao(
        resposta?.mensagem ||
        (status === 'AUTORIZADA'
          ? 'Solicitação autorizada com sucesso.'
          : 'Solicitação recusada com sucesso.')
      )

      await carregarSolicitacoes()
    } catch (error) {
      setErroSolicitacoes(
        error.message || 'Não foi possível responder à solicitação.'
      )
    } finally {
      setSolicitacaoEmProcessamento(null)
    }
  }

  function renderizarAutorizacoes() {
    if (carregandoAutorizacoes) {
      return (
        <div className="morador-feedback">
          <div className="morador-loading" />
          <p>Carregando suas autorizações...</p>
        </div>
      )
    }

    if (erroAutorizacoes) {
      return (
        <div className="morador-feedback morador-feedback-erro">
          <h3>Não foi possível carregar os dados.</h3>
          <p>{erroAutorizacoes}</p>

          <button
            type="button"
            onClick={carregarAutorizacoes}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    if (autorizacoes.length === 0) {
      return (
        <div className="morador-feedback">
          <div className="morador-empty-icon">✓</div>
          <h3>Nenhuma autorização encontrada</h3>
          <p>
            Quando você tiver autorizações cadastradas,
            elas aparecerão nesta área.
          </p>

          <button
            type="button"
            onClick={carregarAutorizacoes}
          >
            Atualizar lista
          </button>
        </div>
      )
    }

    return (
      <>
        <div className="morador-autorizacoes-toolbar">
          <p>
            {autorizacoes.length}{' '}
            {autorizacoes.length === 1
              ? 'autorização encontrada'
              : 'autorizações encontradas'}
          </p>

          <button
            type="button"
            onClick={carregarAutorizacoes}
            disabled={carregandoAutorizacoes}
          >
            ↻ Atualizar
          </button>
        </div>

        <div className="morador-autorizacoes-lista">
          {autorizacoes.map((autorizacao) => {
            const status =
              statusAutorizacao[autorizacao.status] || {
                nome: autorizacao.status || 'Não informado',
                classe: 'desconhecido'
              }

            return (
              <article
                className="morador-autorizacao-card"
                key={autorizacao.id}
              >
                <div className="morador-autorizacao-header">
                  <div>
                    <span className="morador-autorizacao-tipo">
                      {formatarTipoPessoa(
                        autorizacao.pessoa?.tipo_pessoa
                      )}
                    </span>

                    <h3>
                      {autorizacao.pessoa?.nome || 'Pessoa não identificada'}
                    </h3>
                  </div>

                  <span
                    className={`morador-status morador-status-${status.classe}`}
                  >
                    {status.nome}
                  </span>
                </div>

                <div className="morador-autorizacao-detalhes">
                  <div>
                    <span>Período autorizado</span>
                    <strong>
                      {formatarData(autorizacao.data_inicio)}
                      {' até '}
                      {formatarData(autorizacao.data_fim)}
                    </strong>
                  </div>

                  <div>
                    <span>Horário</span>
                    <strong>
                      {autorizacao.hora_inicio || '--:--'}
                      {' às '}
                      {autorizacao.hora_fim || '--:--'}
                    </strong>
                  </div>

                  {autorizacao.motivo && (
                    <div>
                      <span>Motivo</span>
                      <strong>{autorizacao.motivo}</strong>
                    </div>
                  )}

                  {autorizacao.pessoa?.empresa && (
                    <div>
                      <span>Empresa</span>
                      <strong>{autorizacao.pessoa.empresa}</strong>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </>
    )
  }

  function renderizarSolicitacoes() {
    if (carregandoSolicitacoes) {
      return (
        <div className="morador-feedback">
          <div className="morador-loading" />
          <p>Carregando solicitações de visitantes...</p>
        </div>
      )
    }

    if (erroSolicitacoes && solicitacoes.length === 0) {
      return (
        <div className="morador-feedback morador-feedback-erro">
          <h3>Não foi possível carregar as solicitações.</h3>
          <p>{erroSolicitacoes}</p>

          <button
            type="button"
            onClick={carregarSolicitacoes}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return (
      <>
        {mensagemSolicitacao && (
          <div className="morador-feedback morador-feedback-sucesso">
            <p>{mensagemSolicitacao}</p>
          </div>
        )}

        {erroSolicitacoes && (
          <div className="morador-feedback morador-feedback-erro">
            <p>{erroSolicitacoes}</p>
          </div>
        )}

        {solicitacoes.length === 0 ? (
          <div className="morador-feedback">
            <div className="morador-empty-icon">♙</div>
            <h3>Nenhuma solicitação pendente</h3>
            <p>
              Quando um visitante solicitar acesso ao seu apartamento,
              a solicitação aparecerá nesta área.
            </p>

            <button
              type="button"
              onClick={carregarSolicitacoes}
              disabled={carregandoSolicitacoes}
            >
              Atualizar lista
            </button>
          </div>
        ) : (
          <>
            <div className="morador-autorizacoes-toolbar">
              <p>
                {solicitacoes.length}{' '}
                {solicitacoes.length === 1
                  ? 'solicitação pendente'
                  : 'solicitações pendentes'}
              </p>

              <button
                type="button"
                onClick={carregarSolicitacoes}
                disabled={carregandoSolicitacoes || solicitacaoEmProcessamento !== null}
              >
                ↻ Atualizar
              </button>
            </div>

            <div className="morador-autorizacoes-lista">
              {solicitacoes.map((solicitacao) => {
                const processando =
                  solicitacaoEmProcessamento === solicitacao.id

                const existeProcessamento =
                  solicitacaoEmProcessamento !== null

                return (
                  <article
                    className="morador-autorizacao-card"
                    key={solicitacao.id}
                  >
                    <div className="morador-autorizacao-header">
                      <div>
                        <span className="morador-autorizacao-tipo">
                          {formatarTipoPessoa(solicitacao.tipo_pessoa)}
                        </span>

                        <h3>{solicitacao.nome}</h3>
                      </div>

                      <span className="morador-status morador-status-pendente">
                        Pendente
                      </span>
                    </div>

                    <div className="morador-autorizacao-detalhes">
                      <div>
                        <span>CPF</span>
                        <strong>{solicitacao.cpf}</strong>
                      </div>

                      <div>
                        <span>Apartamento</span>
                        <strong>
                          {solicitacao.apartamento?.bloco
                            ? `Bloco ${solicitacao.apartamento.bloco} - `
                            : ''}
                          Apto. {solicitacao.apartamento?.numero || 'Não informado'}
                        </strong>
                      </div>

                      <div>
                        <span>Data da solicitação</span>
                        <strong>
                          {formatarDataHora(
                            solicitacao.data_hora_solicitacao
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Mensagem</span>
                        <strong>
                          {solicitacao.mensagem || 'Nenhuma mensagem informada.'}
                        </strong>
                      </div>
                    </div>

                    <div className="morador-solicitacao-acoes">
                      <button
                        type="button"
                        className="morador-btn-aprovar"
                        onClick={() => responderSolicitacao(solicitacao, 'AUTORIZADA')}
                        disabled={existeProcessamento}
                      >
                        {processando ? 'Processando...' : 'Aprovar'}
                      </button>

                      <button
                        type="button"
                        className="morador-btn-recusar"
                        onClick={() => responderSolicitacao(solicitacao, 'NEGADA')}
                        disabled={existeProcessamento}
                      >
                        {processando ? 'Processando...' : 'Recusar'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <main className="morador-layout">
      <aside className="morador-sidebar">
        <a href="/" className="morador-brand">
          Palm<span>Condo</span>
        </a>

        <div className="morador-sidebar-label">
          ÁREA DO MORADOR
        </div>

        <nav className="morador-nav">
          {secoes.map((secao) => (
            <button
              key={secao.id}
              type="button"
              className={`morador-nav-item ${
                secaoAtiva === secao.id ? 'ativo' : ''
              }`}
              onClick={() => navegarPara(secao.id)}
            >
              <span className="morador-nav-icon">
                {secao.icone}
              </span>

              {secao.nome}
            </button>
          ))}
        </nav>

        <div className="morador-sidebar-footer">
          <div className="morador-user-info">
            <div className="morador-avatar">
              {(usuario?.nome || 'M').charAt(0).toUpperCase()}
            </div>

            <div className="morador-user-text">
              <strong>{usuario?.nome || 'Morador'}</strong>
              <span>Morador</span>
            </div>
          </div>

          <button
            type="button"
            className="morador-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Sair da conta
          </button>
        </div>
      </aside>

      <section className="morador-main">
        <header className="morador-topbar">
          <div>
            <span className="morador-breadcrumb">
              PalmCondo / Área do morador
            </span>

            <h1>{secaoAtual?.nome}</h1>
          </div>

          <div className="morador-topbar-user">
            <div className="morador-avatar">
              {(usuario?.nome || 'M').charAt(0).toUpperCase()}
            </div>

            <span>{usuario?.nome || 'Morador'}</span>
          </div>
        </header>

        <div className="morador-content">
          {secaoAtiva === 'inicio' ? (
            <>
              <div className="morador-welcome">
                <span>SEJA BEM-VINDO AO PALMCONDO</span>

                <h2>
                  Olá, {usuario?.nome || 'morador'}!
                </h2>

                <p>
                  Acesse suas funcionalidades e acompanhe
                  as movimentações relacionadas ao seu apartamento.
                </p>
              </div>

              <div className="morador-section-heading">
                <h3>Acesso rápido</h3>
                <p>Escolha uma opção para continuar.</p>
              </div>

              <div className="morador-cards">
                {secoes.slice(1).map((secao) => (
                  <button
                    key={secao.id}
                    type="button"
                    className="morador-card"
                    onClick={() => navegarPara(secao.id)}
                  >
                    <span className="morador-card-icon">
                      {secao.icone}
                    </span>

                    <strong>{secao.nome}</strong>

                    <span className="morador-card-description">
                      {secao.descricao}
                    </span>

                    <span className="morador-card-link">
                      Acessar →
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : secaoAtiva === 'autorizacoes' ? (
            <section className="morador-autorizacoes">
              <div className="morador-section-heading">
                <h3>Suas autorizações</h3>
                <p>
                  Consulte os períodos e horários autorizados
                  para visitantes e prestadores.
                </p>
              </div>

              {renderizarAutorizacoes()}
            </section>
          ) : secaoAtiva === 'visitantes' ? (
            <section className="morador-autorizacoes">
              <div className="morador-section-heading">
                <h3>Solicitações de visitantes</h3>
                <p>
                  Acompanhe as solicitações de entrada destinadas
                  ao seu apartamento.
                </p>
              </div>

              {renderizarSolicitacoes()}
            </section>
          ) : (
            <div className="morador-empty-state">
              <div className="morador-empty-icon">
                {secaoAtual?.icone}
              </div>

              <h2>{secaoAtual?.nome}</h2>

              <p>{secaoAtual?.descricao}</p>

              <span>
                Esta funcionalidade será implementada
                nas próximas etapas do projeto.
              </span>

              <button
                type="button"
                onClick={() => navegarPara('inicio')}
              >
                Voltar para visão geral
              </button>
            </div>
          )}
        </div>

        <footer className="morador-footer">
          PalmCondo © 2026
          <span>Controle de acesso inteligente</span>
        </footer>
      </section>
    </main>
  )
}

export default Morador
