
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { api } from '../services/api'
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

function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)

  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarCPF(valor) {
  const cpf = valor.replace(/\D/g, '')

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  let soma = 0

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i)
  }

  let primeiroDigito = (soma * 10) % 11

  if (primeiroDigito === 10) {
    primeiroDigito = 0
  }

  if (primeiroDigito !== Number(cpf[9])) {
    return false
  }

  soma = 0

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i)
  }

  let segundoDigito = (soma * 10) % 11

  if (segundoDigito === 10) {
    segundoDigito = 0
  }

  return segundoDigito === Number(cpf[10])
}

function obterTokenDaURL() {
  const parametros = new URLSearchParams(
    window.location.hash.replace(/^#/, '')
  )

  return parametros.get('token') || ''
}

function formatarData(data) {
  if (!data) {
    return 'Não informada'
  }

  const dataFormatada = new Date(data)

  if (Number.isNaN(dataFormatada.getTime())) {
    return 'Não informada'
  }

  return dataFormatada.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function obterDescricaoStatus(status) {
  const descricoes = {
    PENDENTE: 'Aguardando aprovação do morador',
    AUTORIZADA: 'Solicitação aprovada',
    NEGADA: 'Solicitação não autorizada',
    EXPIRADA: 'Solicitação expirada',
    CANCELADA: 'Solicitação cancelada',
  }

  return descricoes[status] || 'Situação não identificada'
}

function Visitante() {
  const { codigo } = useParams()

  const [condominio, setCondominio] = useState(null)
  const [apartamentos, setApartamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [cpf, setCpf] = useState('')
  const [erroCpf, setErroCpf] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroSolicitacao, setErroSolicitacao] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [tokenAcompanhamento, setTokenAcompanhamento] = useState(
    obterTokenDaURL
  )
  const [linkAcompanhamento, setLinkAcompanhamento] = useState('')
  const [acompanhamento, setAcompanhamento] = useState(null)
  const [carregandoAcompanhamento, setCarregandoAcompanhamento] =
    useState(false)
  const [erroAcompanhamento, setErroAcompanhamento] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregarDados() {
      setCarregando(true)
      setErro('')
      setCondominio(null)
      setApartamentos([])

      try {
        if (!codigo) {
          throw new Error('Código do condomínio não informado.')
        }

        const [dadosCondominio, dadosApartamentos] = await Promise.all([
          api.getPublic(
            `/condominios/publico/${encodeURIComponent(codigo)}`
          ),
          api.getPublic(
            `/condominios/publico/${encodeURIComponent(codigo)}/apartamentos`
          ),
        ])

        if (!dadosCondominio?.condominio) {
          throw new Error('Não foi possível identificar o condomínio.')
        }

        if (!Array.isArray(dadosApartamentos?.apartamentos)) {
          throw new Error('Não foi possível carregar os apartamentos.')
        }

        if (!cancelado) {
          setCondominio(dadosCondominio.condominio)
          setApartamentos(dadosApartamentos.apartamentos)
        }
      } catch (error) {
        if (!cancelado) {
          setErro(error.message || 'Erro ao carregar os dados do condomínio.')
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregarDados()

    return () => {
      cancelado = true
    }
  }, [codigo])

  useEffect(() => {
    if (!tokenAcompanhamento || !codigo) {
      return
    }

    let cancelado = false

    async function consultarAcompanhamento() {
      setCarregandoAcompanhamento(true)
      setErroAcompanhamento('')

      try {
        const resposta = await api.getPublic(
          `/visitantes/solicitacoes/publica/${encodeURIComponent(tokenAcompanhamento)}`
        )

        const dadosSolicitacao =
          resposta?.solicitacao ||
          resposta?.dados?.solicitacao ||
          resposta?.dados ||
          resposta

        if (!dadosSolicitacao?.status) {
          throw new Error('Não foi possível consultar a solicitação.')
        }

        if (!cancelado) {
          setAcompanhamento(dadosSolicitacao)
          setLinkAcompanhamento(window.location.href)
        }
      } catch (error) {
        if (!cancelado) {
          setErroAcompanhamento(
            error.message ||
              'Não foi possível consultar sua solicitação. Verifique o link e tente novamente.'
          )
        }
      } finally {
        if (!cancelado) {
          setCarregandoAcompanhamento(false)
        }
      }
    }

    consultarAcompanhamento()

    return () => {
      cancelado = true
    }
  }, [tokenAcompanhamento, codigo])

  useEffect(() => {
    if (!sucesso) {
      return
    }

    const temporizador = setTimeout(() => {
      setSucesso('')
    }, 10000)

    return () => {
      clearTimeout(temporizador)
    }
  }, [sucesso])

  function limparMensagemSucesso() {
    setSucesso('')
    setErroSolicitacao('')
  }

  function handleCPFChange(event) {
    const numeros = event.target.value.replace(/\D/g, '').slice(0, 11)

    setCpf(numeros)
    limparMensagemSucesso()

    if (numeros.length === 11 && !validarCPF(numeros)) {
      setErroCpf('CPF inválido. Confira os números informados.')
    } else {
      setErroCpf('')
    }
  }

  async function copiarLinkAcompanhamento() {
    if (!linkAcompanhamento) {
      return
    }

    try {
      await navigator.clipboard.writeText(linkAcompanhamento)
      setCopiado(true)

      setTimeout(() => {
        setCopiado(false)
      }, 3000)
    } catch {
      setErroAcompanhamento(
        'Não foi possível copiar automaticamente. Copie o link manualmente.'
      )
    }
  }

  async function atualizarAcompanhamento() {
    if (!tokenAcompanhamento) {
      return
    }

    setCarregandoAcompanhamento(true)
    setErroAcompanhamento('')

    try {
      const resposta = await api.getPublic(
        `/visitantes/solicitacoes/publica/${encodeURIComponent(tokenAcompanhamento)}`
      )

      const dadosSolicitacao =
        resposta?.solicitacao ||
        resposta?.dados?.solicitacao ||
        resposta?.dados ||
        resposta

      if (!dadosSolicitacao?.status) {
        throw new Error('Não foi possível consultar a solicitação.')
      }

      setAcompanhamento(dadosSolicitacao)
    } catch (error) {
      setErroAcompanhamento(
        error.message || 'Não foi possível atualizar a solicitação.'
      )
    } finally {
      setCarregandoAcompanhamento(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (enviando) {
      return
    }

    setErroSolicitacao('')
    setSucesso('')

    if (!validarCPF(cpf)) {
      setErroCpf('Informe um CPF válido para continuar.')
      return
    }

    setErroCpf('')

    const formularioElemento = event.currentTarget
    const formulario = new FormData(formularioElemento)

    const tipoPessoa = formulario.get('tipo_pessoa')?.toString()
    const nome = formulario.get('nome')?.toString().trim()
    const apartamentoId = formulario.get('apartamento')?.toString()
    const mensagem = formulario.get('mensagem')?.toString().trim()

    if (
      !tipoPessoa ||
      !['VISITANTE', 'PRESTADOR'].includes(tipoPessoa) ||
      !nome ||
      !apartamentoId ||
      !codigo
    ) {
      setErroSolicitacao(
        'Preencha todos os campos obrigatórios antes de continuar.'
      )
      return
    }

    const dadosSolicitacao = {
      codigo_publico: codigo,
      tipo_pessoa: tipoPessoa,
      nome,
      cpf: cpf.replace(/\D/g, ''),
      apartamento_destino_id: apartamentoId,
      mensagem: mensagem || null,
    }

    try {
      setEnviando(true)

      const resposta = await api.postPublic(
        '/visitantes/solicitacoes',
        dadosSolicitacao
      )

      const token = resposta?.token_acompanhamento

      if (!token) {
        throw new Error(
          'A solicitação foi enviada, mas não foi possível gerar o link de acompanhamento. Entre em contato com o condomínio.'
        )
      }

      const novoLink = `${window.location.origin}/visitante/${encodeURIComponent(codigo)}#token=${encodeURIComponent(token)}`

      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#token=${encodeURIComponent(token)}`
      )

      formularioElemento.reset()
      setCpf('')
      setErroCpf('')
      setSucesso(
        resposta?.mensagem ||
          'Solicitação enviada com sucesso! Aguarde a aprovação do condomínio.'
      )

      setLinkAcompanhamento(novoLink)
      setTokenAcompanhamento(token)
      setAcompanhamento(null)
    } catch (error) {
      setErroSolicitacao(
        error.message ||
          'Não foi possível enviar sua solicitação. Tente novamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  const statusAcompanhamento = acompanhamento?.status
  const codigoLiberacao = acompanhamento?.codigo_liberacao
  const dataExpiracao = acompanhamento?.codigo_expira_em

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
            {tokenAcompanhamento
              ? 'ACOMPANHAMENTO DE SOLICITAÇÃO'
              : 'SOLICITAÇÃO DE ENTRADA'}
          </span>

          <h1>
            {tokenAcompanhamento
              ? 'Acompanhe sua solicitação'
              : 'Solicitação de acesso'}
          </h1>

          <p>
            {tokenAcompanhamento
              ? 'Consulte a situação da sua solicitação de acesso ao condomínio.'
              : 'Informe seus dados para solicitar sua entrada no condomínio.'}
          </p>
        </div>

        <div className="visitante-card">
          <div className="condominio-identificacao">
            <span>CONDOMÍNIO</span>

            <strong>
              {carregando
                ? 'Carregando condomínio...'
                : condominio?.nome || 'Condomínio não identificado'}
            </strong>
          </div>

          {erro && (
            <div className="alert alert-danger" role="alert">
              {erro}
            </div>
          )}

          {!tokenAcompanhamento &&
            !erro &&
            !carregando &&
            apartamentos.length === 0 && (
              <div className="alert alert-warning" role="alert">
                Não existem apartamentos disponíveis para solicitação de acesso.
              </div>
            )}

          {sucesso && (
            <div className="alert alert-success" role="status">
              <strong>Solicitação registrada!</strong>
              <p className="mb-0 mt-1">{sucesso}</p>
              <p className="mb-0 mt-2">
                Guarde o link privado abaixo para acompanhar sua solicitação.
              </p>
            </div>
          )}

          {erroSolicitacao && (
            <div className="alert alert-danger" role="alert">
              {erroSolicitacao}
            </div>
          )}

          {tokenAcompanhamento ? (
            <div className="acompanhamento-solicitacao">
              {carregandoAcompanhamento && !acompanhamento && (
                <div className="alert alert-info" role="status">
                  Consultando sua solicitação...
                </div>
              )}

              {erroAcompanhamento && (
                <div className="alert alert-danger" role="alert">
                  {erroAcompanhamento}
                </div>
              )}

              {acompanhamento && (
                <div className="alert alert-info" role="status">
                  <strong>Situação da solicitação</strong>

                  <p className="mb-0 mt-2">
                    {obterDescricaoStatus(statusAcompanhamento)}
                  </p>

                  {acompanhamento.nome && (
                    <p className="mb-0 mt-2">
                      <strong>Nome completo:</strong> {acompanhamento.nome}
                    </p>
                  )}

                  {acompanhamento.cpf && (
                    <p className="mb-0 mt-1">
                      <strong>CPF:</strong>{' '}
                      {formatarCPF(acompanhamento.cpf)}
                    </p>
                  )}

                  {acompanhamento.tipo_pessoa && (
                    <p className="mb-0 mt-1">
                      <strong>Tipo:</strong>{' '}
                      {acompanhamento.tipo_pessoa === 'PRESTADOR'
                        ? 'Prestador de serviço'
                        : 'Visitante'}
                    </p>
                  )}

                  {acompanhamento.apartamento && (
                    <p className="mb-0 mt-1">
                      <strong>Apartamento:</strong>{' '}
                      {acompanhamento.apartamento.bloco
                        ? `Bloco ${acompanhamento.apartamento.bloco} - `
                        : ''}
                      {acompanhamento.apartamento.numero}
                    </p>
                  )}

                  {acompanhamento.mensagem && (
                    <p className="mb-0 mt-1">
                      <strong>Mensagem:</strong> {acompanhamento.mensagem}
                    </p>
                  )}

                  {acompanhamento.data_hora_solicitacao && (
                    <p className="mb-0 mt-1">
                      <strong>Solicitação enviada:</strong>{' '}
                      {formatarData(acompanhamento.data_hora_solicitacao)}
                    </p>
                  )}

                  {statusAcompanhamento === 'AUTORIZADA' &&
                    codigoLiberacao && (
                      <div className="mt-3 p-3 bg-white rounded">
                        <strong>Código de liberação</strong>

                        <div className="fs-2 fw-bold text-center my-2">
                          {codigoLiberacao}
                        </div>

                        <p className="mb-0">
                          Apresente este código ao responsável pela liberação
                          da entrada.
                        </p>

                        <p className="mb-0 mt-2">
                          <strong>Válido até:</strong>{' '}
                          {formatarData(dataExpiracao)}
                        </p>
                      </div>
                    )}

                  {statusAcompanhamento === 'AUTORIZADA' &&
                    !codigoLiberacao && (
                      <p className="mb-0 mt-2">
                        A solicitação foi aprovada, mas o código de liberação
                        não está disponível ou já expirou.
                      </p>
                    )}
                </div>
              )}

              <button
                type="button"
                className="visitante-button mt-3"
                onClick={atualizarAcompanhamento}
                disabled={carregandoAcompanhamento}
              >
                {carregandoAcompanhamento
                  ? 'Atualizando...'
                  : 'Atualizar situação'}
              </button>

              {linkAcompanhamento && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={copiarLinkAcompanhamento}
                  >
                    {copiado ? 'Link copiado!' : 'Copiar link de acompanhamento'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="tipo_pessoa" className="form-label">
                  Tipo de acesso
                </label>

                <select
                  id="tipo_pessoa"
                  name="tipo_pessoa"
                  className="form-select"
                  defaultValue=""
                  required
                  onChange={limparMensagemSucesso}
                  disabled={enviando}
                >
                  <option value="" disabled>
                    Selecione uma opção
                  </option>

                  <option value="VISITANTE">
                    Visitante
                  </option>

                  <option value="PRESTADOR">
                    Prestador de serviço
                  </option>
                </select>
              </div>

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
                  onChange={limparMensagemSucesso}
                  disabled={
                    carregando ||
                    Boolean(erro) ||
                    apartamentos.length === 0 ||
                    enviando
                  }
                >
                  <option value="" disabled>
                    {carregando
                      ? 'Carregando apartamentos...'
                      : 'Selecione o apartamento'}
                  </option>

                  {apartamentos.map((apartamento) => (
                    <option key={apartamento.id} value={apartamento.id}>
                      {apartamento.bloco
                        ? `Bloco ${apartamento.bloco} - `
                        : ''}
                      Apto {apartamento.numero}
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
                  maxLength={150}
                  required
                  onChange={limparMensagemSucesso}
                  disabled={enviando}
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
                  className={`form-control ${erroCpf ? 'is-invalid' : ''}`}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  value={formatarCPF(cpf)}
                  onChange={handleCPFChange}
                  aria-invalid={Boolean(erroCpf)}
                  aria-describedby="cpf-feedback"
                  required
                  disabled={enviando}
                />

                {erroCpf && (
                  <div id="cpf-feedback" className="invalid-feedback">
                    {erroCpf}
                  </div>
                )}
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
                  onChange={limparMensagemSucesso}
                  disabled={enviando}
                />

                <div className="form-text">
                  Máximo de 100 caracteres.
                </div>
              </div>

              <button
                type="submit"
                className="visitante-button"
                disabled={
                  carregando ||
                  Boolean(erro) ||
                  apartamentos.length === 0 ||
                  enviando
                }
              >
                {enviando ? 'Enviando solicitação...' : 'Enviar solicitação'}
              </button>
            </form>
          )}
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
