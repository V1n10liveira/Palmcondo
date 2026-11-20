
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
    id: 'solicitacoes',
    nome: 'Solicitações de acesso',
    icone: '♙',
    descricao: 'Gerencie solicitações de visitantes e prestadores.'
  },
  {
    id: 'historico',
    nome: 'Histórico',
    icone: '◷',
    descricao: 'Consulte o histórico disponível de solicitações.'
  }
]

const statusAutorizacao = {
  PENDENTE: { nome: 'Pendente', classe: 'pendente' },
  ATIVA: { nome: 'Ativa', classe: 'ativa' },
  UTILIZADA: { nome: 'Utilizada', classe: 'utilizada' },
  EXPIRADA: { nome: 'Expirada', classe: 'expirada' },
  CANCELADA: { nome: 'Cancelada', classe: 'cancelada' },
  BLOQUEADA: { nome: 'Bloqueada', classe: 'bloqueada' }
}

const statusSolicitacao = {
  PENDENTE: { nome: 'Pendente', classe: 'pendente' },
  AUTORIZADA: { nome: 'Autorizada', classe: 'ativa' },
  EXPIRADA: { nome: 'Expirada', classe: 'expirada' },
  NEGADA: { nome: 'Recusada', classe: 'recusada' },
  CANCELADA: { nome: 'Cancelada', classe: 'cancelada' }
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

function calcularExpiracao(dataAprovacao) {
  if (!dataAprovacao) return null

  const data = new Date(dataAprovacao)

  if (Number.isNaN(data.getTime())) {
    return null
  }

  data.setHours(data.getHours() + 24)

  return data
}

function formatarTipoPessoa(tipo) {
  const tipos = {
    VISITANTE: 'Visitante',
    PRESTADOR: 'Prestador de serviço'
  }

  return tipos[tipo] || tipo || 'Não informado'
}

function mascararCpf(cpf) {
  if (!cpf) return 'Não informado'
  return '***.***.***-**'
}

function obterDataISO(data) {
  if (!data) return ''

  const dataObj = new Date(data)

  if (Number.isNaN(dataObj.getTime())) {
    return ''
  }

  const ano = dataObj.getFullYear()
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0')
  const dia = String(dataObj.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
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

  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroDataInicial, setFiltroDataInicial] = useState('')
  const [filtroDataFinal, setFiltroDataFinal] = useState('')

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
    if (secaoAtiva === 'inicio') {
      carregarAutorizacoes()
      carregarSolicitacoes()
    }

    if (secaoAtiva === 'autorizacoes') {
      carregarAutorizacoes()
    }

    if (secaoAtiva === 'solicitacoes') {
      setMensagemSolicitacao('')
      carregarSolicitacoes()
    }

    if (secaoAtiva === 'historico') {
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
      await carregarAutorizacoes()
    } catch (error) {
      setErroSolicitacoes(
        error.message || 'Não foi possível responder à solicitação.'
      )
    } finally {
      setSolicitacaoEmProcessamento(null)
    }
  }

  function renderizarIndicadores() {
    const indicadores = [
      {
        titulo: 'Autorizações ativas',
        valor: autorizacoes.filter(
          (item) => item.status === 'ATIVA'
        ).length,
        carregando: carregandoAutorizacoes,
        descricao: 'Autorizações disponíveis',
        icone: '✓',
        secao: 'autorizacoes'
      },
      {
        titulo: 'Solicitações pendentes',
        valor: solicitacoes.filter(
          (item) => item.status === 'PENDENTE'
        ).length,
        carregando: carregandoSolicitacoes,
        descricao: 'Aguardando sua aprovação',
        icone: '♙',
        secao: 'solicitacoes'
      },
      {
        titulo: 'Solicitações aprovadas',
        valor: solicitacoes.filter(
          (item) => item.status === 'AUTORIZADA'
        ).length,
        carregando: carregandoSolicitacoes,
        descricao: 'Acessos autorizados',
        icone: '✓',
        secao: 'historico'
      },
      {
        titulo: 'Solicitações expiradas',
        valor: solicitacoes.filter(
          (item) => item.status === 'EXPIRADA'
        ).length,
        carregando: carregandoSolicitacoes,
        descricao: 'Solicitações com prazo encerrado',
        icone: '◷',
        secao: 'historico'
      }
    ]

    return (
      <div className="morador-cards">
        {indicadores.map((indicador) => (
          <button
            key={indicador.titulo}
            type="button"
            className="morador-card"
            onClick={() => navegarPara(indicador.secao)}
          >
            <span className="morador-card-icon">
              {indicador.icone}
            </span>

            <strong>{indicador.titulo}</strong>

            <span
              style={{
                display: 'block',
                marginTop: '10px',
                color: '#171717',
                fontSize: '28px',
                fontWeight: 850,
                lineHeight: 1.2
              }}
            >
              {indicador.carregando ? '...' : indicador.valor}
            </span>

            <span className="morador-card-description">
              {indicador.descricao}
            </span>

            <span className="morador-card-link">
              Consultar →
            </span>
          </button>
        ))}
      </div>
    )
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

          <button type="button" onClick={carregarAutorizacoes}>
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

          <button type="button" onClick={carregarAutorizacoes}>
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

  function renderizarCartaoSolicitacao(solicitacao, modoHistorico = false) {
    const status =
      statusSolicitacao[solicitacao.status] || {
        nome: solicitacao.status || 'Não informado',
        classe: 'desconhecido'
      }

    const processando =
      solicitacaoEmProcessamento === solicitacao.id

    const existeProcessamento =
      solicitacaoEmProcessamento !== null

    const dataExpiracao =
      solicitacao.status === 'AUTORIZADA'
        ? (
            solicitacao.codigo_expira_em
              ? new Date(solicitacao.codigo_expira_em)
              : calcularExpiracao(solicitacao.data_hora_resposta)
          )
        : null

    const expiracaoValida =
      dataExpiracao && !Number.isNaN(dataExpiracao.getTime())

    const tipoPessoaClasse =
      solicitacao.tipo_pessoa === 'PRESTADOR'
        ? 'morador-tipo-prestador'
        : 'morador-tipo-visitante'

    return (
      <article
        className="morador-autorizacao-card"
        key={solicitacao.id}
      >
        <div className="morador-autorizacao-header">
          <div>
            <span
              className={`morador-autorizacao-tipo ${tipoPessoaClasse}`}
            >
              {formatarTipoPessoa(solicitacao.tipo_pessoa)}
            </span>

            <h3>{solicitacao.nome}</h3>
          </div>

          <span className={`morador-status morador-status-${status.classe}`}>
            {status.nome}
          </span>
        </div>

        <div className="morador-autorizacao-detalhes">
          <div>
            <span>CPF</span>
            <strong>
              {modoHistorico
                ? mascararCpf(solicitacao.cpf)
                : solicitacao.cpf || 'Não informado'}
            </strong>
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
              {formatarDataHora(solicitacao.data_hora_solicitacao)}
            </strong>
          </div>

          {solicitacao.data_hora_resposta && (
            <div>
              <span>Data da resposta</span>
              <strong>
                {formatarDataHora(solicitacao.data_hora_resposta)}
              </strong>
            </div>
          )}

          {solicitacao.status === 'AUTORIZADA' && expiracaoValida && (
            <div>
              <span>Autorização válida até</span>
              <strong>{dataExpiracao.toLocaleString('pt-BR')}</strong>
            </div>
          )}

          {solicitacao.mensagem && (
            <div>
              <span>Mensagem</span>
              <strong>{solicitacao.mensagem}</strong>
            </div>
          )}
        </div>

        {solicitacao.status === 'AUTORIZADA' && (
          <div className="morador-autorizacao-aviso">
            Autorização válida por 24 horas a partir da aprovação.
          </div>
        )}

        {!modoHistorico && solicitacao.status === 'PENDENTE' && (
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
        )}
      </article>
    )
  }

  function renderizarGrupoSolicitacoes(titulo, itens) {
    if (itens.length === 0) return null

    return (
      <section className="morador-grupo-solicitacoes">
        <div className="morador-grupo-solicitacoes-titulo">
          <h3>{titulo}</h3>
          <span>{itens.length}</span>
        </div>

        <div className="morador-autorizacoes-lista">
          {itens.map((solicitacao) =>
            renderizarCartaoSolicitacao(solicitacao)
          )}
        </div>
      </section>
    )
  }

  function renderizarSolicitacoes() {
    if (carregandoSolicitacoes) {
      return (
        <div className="morador-feedback">
          <div className="morador-loading" />
          <p>Carregando solicitações de acesso...</p>
        </div>
      )
    }

    if (erroSolicitacoes && solicitacoes.length === 0) {
      return (
        <div className="morador-feedback morador-feedback-erro">
          <h3>Não foi possível carregar as solicitações.</h3>
          <p>{erroSolicitacoes}</p>

          <button type="button" onClick={carregarSolicitacoes}>
            Tentar novamente
          </button>
        </div>
      )
    }

    const pendentes = solicitacoes
      .filter((item) => item.status === 'PENDENTE')
      .sort((a, b) =>
        new Date(b.data_hora_solicitacao) -
        new Date(a.data_hora_solicitacao)
      )

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

        <div className="morador-autorizacoes-toolbar">
          <p>
            {pendentes.length}{' '}
            {pendentes.length === 1
              ? 'solicitação pendente'
              : 'solicitações pendentes'}
          </p>

          <button
            type="button"
            onClick={carregarSolicitacoes}
            disabled={
              carregandoSolicitacoes ||
              solicitacaoEmProcessamento !== null
            }
          >
            ↻ Atualizar
          </button>
        </div>

        {pendentes.length === 0 ? (
          <div className="morador-feedback">
            <div className="morador-empty-icon">✓</div>
            <h3>Nenhuma solicitação pendente</h3>
            <p>
              Você não possui solicitações aguardando aprovação.
              As solicitações respondidas podem ser consultadas no Histórico.
            </p>

            <button
              type="button"
              onClick={() => navegarPara('historico')}
            >
              Consultar histórico
            </button>
          </div>
        ) : (
          <div className="morador-solicitacoes-grupos">
            {renderizarGrupoSolicitacoes(
              'Aguardando sua aprovação',
              pendentes
            )}
          </div>
        )}
      </>
    )
  }

  function renderizarHistorico() {
    if (carregandoSolicitacoes) {
      return (
        <div className="morador-feedback">
          <div className="morador-loading" />
          <p>Carregando histórico de solicitações...</p>
        </div>
      )
    }

    if (erroSolicitacoes && solicitacoes.length === 0) {
      return (
        <div className="morador-feedback morador-feedback-erro">
          <h3>Não foi possível carregar o histórico.</h3>
          <p>{erroSolicitacoes}</p>

          <button type="button" onClick={carregarSolicitacoes}>
            Tentar novamente
          </button>
        </div>
      )
    }

    const historicoFiltrado = solicitacoes
      .filter((solicitacao) => {
        if (
          filtroStatus !== 'TODOS' &&
          solicitacao.status !== filtroStatus
        ) {
          return false
        }

        const dataSolicitacao = obterDataISO(
          solicitacao.data_hora_solicitacao
        )

        if (
          filtroDataInicial &&
          (!dataSolicitacao || dataSolicitacao < filtroDataInicial)
        ) {
          return false
        }

        if (
          filtroDataFinal &&
          (!dataSolicitacao || dataSolicitacao > filtroDataFinal)
        ) {
          return false
        }

        return true
      })
      .sort((a, b) =>
        new Date(b.data_hora_solicitacao) -
        new Date(a.data_hora_solicitacao)
      )

    return (
      <>
        {erroSolicitacoes && (
          <div className="morador-feedback morador-feedback-erro">
            <p>{erroSolicitacoes}</p>
          </div>
        )}

        <div className="morador-autorizacoes-toolbar">
          <p>
            {historicoFiltrado.length}{' '}
            {historicoFiltrado.length === 1
              ? 'registro encontrado'
              : 'registros encontrados'}
          </p>

          <button
            type="button"
            onClick={carregarSolicitacoes}
            disabled={carregandoSolicitacoes}
          >
            ↻ Atualizar
          </button>
        </div>

        <div className="morador-historico-filtros">
          <div className="morador-historico-filtro">
            <label htmlFor="historico-status">Situação</label>
            <select
              id="historico-status"
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
            >
              <option value="TODOS">Todas as situações</option>
              <option value="PENDENTE">Pendente</option>
              <option value="AUTORIZADA">Autorizada</option>
              <option value="NEGADA">Recusada</option>
              <option value="EXPIRADA">Expirada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="morador-historico-filtro">
            <label htmlFor="historico-data-inicial">Data inicial</label>
            <input
              id="historico-data-inicial"
              type="date"
              value={filtroDataInicial}
              max={filtroDataFinal || undefined}
              onChange={(event) => setFiltroDataInicial(event.target.value)}
            />
          </div>

          <div className="morador-historico-filtro">
            <label htmlFor="historico-data-final">Data final</label>
            <input
              id="historico-data-final"
              type="date"
              value={filtroDataFinal}
              min={filtroDataInicial || undefined}
              onChange={(event) => setFiltroDataFinal(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFiltroStatus('TODOS')
              setFiltroDataInicial('')
              setFiltroDataFinal('')
            }}
          >
            Limpar filtros
          </button>
        </div>

        {historicoFiltrado.length === 0 ? (
          <div className="morador-feedback">
            <div className="morador-empty-icon">◷</div>
            <h3>Nenhum registro encontrado</h3>
            <p>
              Não existem solicitações correspondentes aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="morador-autorizacoes-lista">
            {historicoFiltrado.map((solicitacao) =>
              renderizarCartaoSolicitacao(solicitacao, true)
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <main className="morador-layout">
      <aside className="morador-sidebar">
        <a href="/" className="morador-brand" aria-label="PalmCondo - início">
          <span className="morador-brand-icon">
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
          </span>

          <span>
            Palm<span>Condo</span>
          </span>
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

            <span className="morador-topbar-user-name">
              {usuario?.nome || 'Morador'}
            </span>

            <button
              type="button"
              className="morador-topbar-logout"
              onClick={handleLogout}
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
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

              <span>Sair</span>
            </button>
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
                <h3>Resumo do seu apartamento</h3>
                <p>
                  Acompanhe abaixo a situação das suas autorizações
                  e solicitações de acesso.
                </p>
              </div>

              {renderizarIndicadores()}
            </>
          ) : secaoAtiva === 'autorizacoes' ? (
            <section className="morador-autorizacoes">
              <div className="morador-section-heading">
                <h3>Minhas autorizações</h3>
                <p>
                  Consulte os períodos e horários autorizados
                  para visitantes e prestadores.
                </p>
              </div>

              {renderizarAutorizacoes()}
            </section>
          ) : secaoAtiva === 'solicitacoes' ? (
            <section className="morador-autorizacoes">
              <div className="morador-section-heading">
                <h3>Solicitações de acesso</h3>
                <p>
                  Analise as solicitações pendentes de visitantes
                  e prestadores que aguardam sua aprovação.
                </p>
              </div>

              {renderizarSolicitacoes()}
            </section>
          ) : secaoAtiva === 'historico' ? (
            <section className="morador-autorizacoes">
              <div className="morador-section-heading">
                <h3>Histórico de solicitações</h3>
                <p>
                  Consulte todas as solicitações recebidas,
                  incluindo as pendentes e as já respondidas.
                </p>
              </div>

              {renderizarHistorico()}
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
