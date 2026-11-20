
import { useCallback, useEffect, useRef, useState } from 'react'
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
    id: 'convite',
    nome: 'Criar convite',
    icone: '✉',
    descricao: 'Gere convites autorizados para visitantes e prestadores.'
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

  const audioContextRef = useRef(null)
  const audioLiberadoRef = useRef(false)
  const audioHabilitandoRef = useRef(false)
  const idsNotificacoesRef = useRef(new Set())
  const primeiraCargaNotificacoesRef = useRef(false)

  const [secaoAtiva, setSecaoAtiva] = useState('inicio')

  const [autorizacoes, setAutorizacoes] = useState([])
  const [carregandoAutorizacoes, setCarregandoAutorizacoes] = useState(false)
  const [erroAutorizacoes, setErroAutorizacoes] = useState('')

  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false)
  const [erroSolicitacoes, setErroSolicitacoes] = useState('')
  const [mensagemSolicitacao, setMensagemSolicitacao] = useState('')
  const [solicitacaoEmProcessamento, setSolicitacaoEmProcessamento] = useState(null)

  const [notificacoes, setNotificacoes] = useState([])
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)
  const [erroNotificacoes, setErroNotificacoes] = useState('')
  const [notificacaoEmProcessamento, setNotificacaoEmProcessamento] = useState(null)
  const [marcandoTodasComoLidas, setMarcandoTodasComoLidas] = useState(false)

  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroDataInicial, setFiltroDataInicial] = useState('')
  const [filtroDataFinal, setFiltroDataFinal] = useState('')

  // Estados da criação de convites.
  const [tipoConvite, setTipoConvite] = useState('VISITANTE')
  const [nomeConvite, setNomeConvite] = useState('')
  const [cpfConvite, setCpfConvite] = useState('')
  const [criandoConvite, setCriandoConvite] = useState(false)
  const [erroConvite, setErroConvite] = useState('')
  const [mensagemConvite, setMensagemConvite] = useState('')
  const [conviteGerado, setConviteGerado] = useState(null)
  const [copiandoLinkConvite, setCopiandoLinkConvite] = useState(false)
  const [linkConviteCopiado, setLinkConviteCopiado] = useState(false)

  const secaoAtual = secoes.find(
    (secao) => secao.id === secaoAtiva
  )

  // Prepara o áudio na primeira interação do morador com a página.
  async function habilitarSomNotificacoes() {
    if (audioLiberadoRef.current || audioHabilitandoRef.current) {
      return
    }

    audioHabilitandoRef.current = true

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext

      if (!AudioContextClass) {
        return
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      audioLiberadoRef.current =
        audioContextRef.current.state === 'running'
    } catch (error) {
      console.warn('Não foi possível habilitar o som das notificações.', error)
    } finally {
      audioHabilitandoRef.current = false
    }
  }

  useEffect(() => {
    function aoInteragir() {
      habilitarSomNotificacoes()
    }

    document.addEventListener('pointerdown', aoInteragir, true)
    document.addEventListener('keydown', aoInteragir, true)
    document.addEventListener('touchstart', aoInteragir, true)

    return () => {
      document.removeEventListener('pointerdown', aoInteragir, true)
      document.removeEventListener('keydown', aoInteragir, true)
      document.removeEventListener('touchstart', aoInteragir, true)
    }
  }, [])

  // Emite um alerta sonoro de aproximadamente 5,5 segundos.
  function tocarSomNotificacao() {
    const audioContext = audioContextRef.current

    if (!audioLiberadoRef.current || !audioContext) {
      return
    }

    if (audioContext.state !== 'running') {
      return
    }

    try {
      const agora = audioContext.currentTime
      const duracaoNota = 0.45
      const volumeMaximo = 0.22
      const frequencias = [880, 1046.5]

      for (let ciclo = 0; ciclo < 5; ciclo++) {
        frequencias.forEach((frequencia, indice) => {
          const inicio =
            agora + ciclo * 1.10 + indice * 0.55

          const oscilador = audioContext.createOscillator()
          const volume = audioContext.createGain()

          oscilador.type = 'sine'
          oscilador.frequency.setValueAtTime(
            frequencia,
            inicio
          )

          volume.gain.setValueAtTime(0.0001, inicio)
          volume.gain.exponentialRampToValueAtTime(
            volumeMaximo,
            inicio + 0.04
          )
          volume.gain.setValueAtTime(
            volumeMaximo,
            inicio + duracaoNota - 0.08
          )
          volume.gain.exponentialRampToValueAtTime(
            0.0001,
            inicio + duracaoNota
          )

          oscilador.connect(volume)
          volume.connect(audioContext.destination)

          oscilador.start(inicio)
          oscilador.stop(inicio + duracaoNota)
        })
      }
    } catch (error) {
      console.warn('Não foi possível reproduzir o som da notificação.', error)
    }
  }

  function atualizarEstadoNotificacoes(resposta, emitirSom = false) {
    const lista = Array.isArray(resposta?.notificacoes)
      ? resposta.notificacoes
      : []

    const novosIds = new Set(
      lista.map((notificacao) => String(notificacao.id))
    )

    if (primeiraCargaNotificacoesRef.current) {
      const chegouNotificacaoNova = lista.some(
        (notificacao) =>
          !idsNotificacoesRef.current.has(String(notificacao.id))
      )

      if (emitirSom && chegouNotificacaoNova) {
        tocarSomNotificacao()
      }
    } else {
      primeiraCargaNotificacoesRef.current = true
    }

    idsNotificacoesRef.current = novosIds

    setNotificacoes(lista)

    setTotalNaoLidas(
      Number(resposta?.total_nao_lidas) || 0
    )

    setErroNotificacoes('')
  }

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

  const carregarNotificacoes = useCallback(async () => {
    try {
      const resposta = await api.get('/notificacoes')

      atualizarEstadoNotificacoes(resposta)
    } catch (error) {
      setErroNotificacoes(
        error.message || 'Não foi possível carregar as notificações.'
      )
    }
  }, [])

  useEffect(() => {
    let ativo = true

    async function atualizarNotificacoes() {
      try {
        const resposta = await api.get('/notificacoes')

        if (!ativo) return

        atualizarEstadoNotificacoes(resposta, true)
      } catch (error) {
        if (!ativo) return

        setErroNotificacoes(
          error.message || 'Não foi possível carregar as notificações.'
        )
      }
    }

    atualizarNotificacoes()

    const intervalo = window.setInterval(
      atualizarNotificacoes,
      15000
    )

    return () => {
      ativo = false
      window.clearInterval(intervalo)
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

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    navigate('/login', { replace: true })
  }

  function navegarPara(secao) {
    setSecaoAtiva(secao)
  }

  // Cria um convite já autorizado para o morador autenticado.
  async function criarConvite(event) {
    event.preventDefault()

    setErroConvite('')
    setMensagemConvite('')
    setConviteGerado(null)
    setLinkConviteCopiado(false)

    const nome = nomeConvite.trim()
    const cpf = cpfConvite.replace(/\D/g, '')

    if (!nome) {
      setErroConvite('Informe o nome completo do visitante ou prestador.')
      return
    }

    if (cpf.length !== 11) {
      setErroConvite('Informe um CPF com 11 números.')
      return
    }

    setCriandoConvite(true)

    try {
      const resposta = await api.post('/visitantes/convites', {
        nome,
        cpf,
        tipo_pessoa: tipoConvite
      })

      const codigoPublico = resposta?.codigo_publico
      const token = resposta?.token_acompanhamento
      const codigoLiberacao = resposta?.codigo_liberacao

      if (!codigoPublico || !token || !codigoLiberacao) {
        throw new Error(
          'A resposta do servidor não contém todos os dados necessários para exibir o convite.'
        )
      }

      const link = `${window.location.origin}/visitante/${encodeURIComponent(codigoPublico)}#token=${encodeURIComponent(token)}`

      setConviteGerado({
        nome: resposta.convite?.nome || nome,
        tipo: resposta.convite?.tipo_pessoa || tipoConvite,
        codigo: codigoLiberacao,
        link,
        apartamento: resposta.convite?.apartamento || null,
        validade: resposta.convite?.codigo_expira_em || null
      })

      setMensagemConvite(
        resposta.mensagem || 'Convite criado e autorizado com sucesso.'
      )

      setNomeConvite('')
      setCpfConvite('')
    } catch (error) {
      setErroConvite(
        error.message || 'Não foi possível criar o convite.'
      )
    } finally {
      setCriandoConvite(false)
    }
  }

  // Copia o link e atualiza o próprio botão para confirmar a ação.
  async function copiarLinkConvite() {
    if (!conviteGerado?.link || copiandoLinkConvite) return

    setCopiandoLinkConvite(true)
    setErroConvite('')

    try {
      await navigator.clipboard.writeText(conviteGerado.link)

      setLinkConviteCopiado(true)
      setMensagemConvite(
        'Link copiado com sucesso! Agora você pode enviá-lo pelo WhatsApp.'
      )
    } catch (error) {
      console.warn('Não foi possível copiar o link automaticamente.', error)

      setLinkConviteCopiado(false)
      setErroConvite(
        'Não foi possível copiar automaticamente. Selecione o link exibido e copie manualmente.'
      )
    } finally {
      setCopiandoLinkConvite(false)
    }
  }

  async function marcarNotificacaoComoLida(notificacao) {
    if (notificacao.lida || notificacaoEmProcessamento !== null) {
      return
    }

    setNotificacaoEmProcessamento(notificacao.id)
    setErroNotificacoes('')

    try {
      await api.patch(`/notificacoes/${notificacao.id}/lida`)

      setNotificacoes((atuais) =>
        atuais.map((item) =>
          item.id === notificacao.id
            ? { ...item, lida: true }
            : item
        )
      )

      setTotalNaoLidas((total) => Math.max(0, total - 1))
    } catch (error) {
      setErroNotificacoes(
        error.message || 'Não foi possível marcar a notificação como lida.'
      )
    } finally {
      setNotificacaoEmProcessamento(null)
    }
  }

  async function marcarTodasComoLidas() {
    if (totalNaoLidas === 0 || marcandoTodasComoLidas) {
      return
    }

    setMarcandoTodasComoLidas(true)
    setErroNotificacoes('')

    try {
      await api.patch('/notificacoes/lidas/todas')

      setNotificacoes((atuais) =>
        atuais.map((notificacao) => ({
          ...notificacao,
          lida: true
        }))
      )

      setTotalNaoLidas(0)
    } catch (error) {
      setErroNotificacoes(
        error.message || 'Não foi possível atualizar as notificações.'
      )
    } finally {
      setMarcandoTodasComoLidas(false)
    }
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

  function renderizarConvite() {
    return (
      <section className="morador-autorizacoes">
        <div className="morador-section-heading">
          <h3>Criar convite</h3>
          <p>
            Gere um convite com acesso previamente autorizado e compartilhe
            o link individual com o visitante ou prestador.
          </p>
        </div>

        {erroConvite && (
          <div className="morador-feedback morador-feedback-erro">
            <p>{erroConvite}</p>
          </div>
        )}

        {mensagemConvite && (
          <div className="morador-feedback morador-feedback-sucesso">
            <p>{mensagemConvite}</p>
          </div>
        )}

        <form
          onSubmit={criarConvite}
          style={{
            maxWidth: '520px',
            padding: '20px',
            background: '#fff',
            border: '1px solid #e9e9e3',
            borderRadius: '12px'
          }}
        >
          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="tipo-convite"
              style={{
                display: 'block',
                marginBottom: '7px',
                color: '#333',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              Tipo de acesso
            </label>

            <select
              id="tipo-convite"
              value={tipoConvite}
              onChange={(event) => setTipoConvite(event.target.value)}
              disabled={criandoConvite}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            >
              <option value="VISITANTE">Visitante</option>
              <option value="PRESTADOR">Prestador de serviço</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="nome-convite"
              style={{
                display: 'block',
                marginBottom: '7px',
                color: '#333',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              Nome completo
            </label>

            <input
              id="nome-convite"
              type="text"
              value={nomeConvite}
              onChange={(event) => setNomeConvite(event.target.value)}
              placeholder="Digite o nome completo"
              maxLength={150}
              required
              disabled={criandoConvite}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="cpf-convite"
              style={{
                display: 'block',
                marginBottom: '7px',
                color: '#333',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              CPF
            </label>

            <input
              id="cpf-convite"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cpfConvite}
              onChange={(event) => {
                const numeros = event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 11)

                const formatado = numeros
                  .replace(/^(\d{3})(\d)/, '$1.$2')
                  .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                  .replace(/\.(\d{3})(\d)/, '.$1-$2')

                setCpfConvite(formatado)
              }}
              placeholder="000.000.000-00"
              required
              disabled={criandoConvite}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            />
          </div>

          <div
            style={{
              marginBottom: '16px',
              padding: '11px',
              background: '#fff9df',
              borderRadius: '8px',
              color: '#665300',
              fontSize: '11px',
              lineHeight: 1.6
            }}
          >
            O apartamento será vinculado automaticamente ao seu cadastro.
            O convite será criado como autorizado, sem precisar de uma nova
            aprovação.
          </div>

          <button
            type="submit"
            disabled={criandoConvite}
            style={{
              width: '100%',
              padding: '11px',
              color: '#171717',
              background: '#ffd000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: criandoConvite ? 'wait' : 'pointer',
              opacity: criandoConvite ? 0.6 : 1
            }}
          >
            {criandoConvite ? 'Gerando convite...' : 'Gerar convite autorizado'}
          </button>
        </form>

        {conviteGerado && (
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              boxSizing: 'border-box',
              marginTop: '16px',
              padding: '16px',
              background: '#fff',
              border: '1px solid #e9e9e3',
              borderRadius: '11px'
            }}
          >
            <h3
              style={{
                margin: '0 0 13px',
                color: '#171717',
                fontSize: '18px',
                fontWeight: 750
              }}
            >
              Convite gerado com sucesso!
            </h3>

            <div
              style={{
                display: 'grid',
                gap: '7px',
                color: '#333',
                fontSize: '12px',
                lineHeight: 1.5
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Nome:</strong> {conviteGerado.nome}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Tipo:</strong> {formatarTipoPessoa(conviteGerado.tipo)}
              </p>

              {conviteGerado.apartamento && (
                <p style={{ margin: 0 }}>
                  <strong>Apartamento:</strong>{' '}
                  {conviteGerado.apartamento.bloco
                    ? `Bloco ${conviteGerado.apartamento.bloco} - `
                    : ''}
                  {conviteGerado.apartamento.numero}
                </p>
              )}

              {conviteGerado.validade && (
                <p style={{ margin: 0 }}>
                  <strong>Válido até:</strong>{' '}
                  {formatarDataHora(conviteGerado.validade)}
                </p>
              )}
            </div>

            <div
              style={{
                margin: '13px 0',
                padding: '12px',
                background: '#fff9df',
                borderRadius: '9px',
                textAlign: 'center'
              }}
            >
              <span
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  color: '#665300',
                  fontSize: '10px',
                  fontWeight: 750,
                  letterSpacing: '0.3px'
                }}
              >
                CÓDIGO DE LIBERAÇÃO
              </span>

              <strong
                style={{
                  display: 'block',
                  color: '#171717',
                  fontSize: '24px',
                  letterSpacing: '4px'
                }}
              >
                {conviteGerado.codigo}
              </strong>
            </div>

            <label
              htmlFor="link-convite-gerado"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '11px',
                fontWeight: 750
              }}
            >
              Link individual do convite
            </label>

            <input
              id="link-convite-gerado"
              type="text"
              readOnly
              value={conviteGerado.link}
              onFocus={(event) => event.target.select()}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px',
                border: '1px solid #ddd',
                borderRadius: '7px',
                fontSize: '10px',
                color: '#555'
              }}
            />

            <button
              type="button"
              onClick={copiarLinkConvite}
              disabled={copiandoLinkConvite}
              style={{
                width: '100%',
                marginTop: '9px',
                padding: '11px',
                color: linkConviteCopiado ? '#176b37' : '#fff',
                background: linkConviteCopiado ? '#e7f5eb' : '#171717',
                border: linkConviteCopiado
                  ? '1px solid #cde8d4'
                  : '1px solid #171717',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '12px',
                cursor: copiandoLinkConvite ? 'wait' : 'pointer',
                opacity: copiandoLinkConvite ? 0.6 : 1
              }}
            >
              {copiandoLinkConvite
                ? 'Copiando...'
                : linkConviteCopiado
                  ? '✓ Link copiado!'
                  : 'Copiar link do convite'}
            </button>

            <p
              style={{
                margin: '9px 0 0',
                color: '#777',
                fontSize: '10px',
                lineHeight: 1.5
              }}
            >
              Envie o link ao convidado pelo WhatsApp ou outro aplicativo.
              Ele poderá consultar os dados do convite e apresentar o código
              de liberação na entrada.
            </p>
          </div>
        )}
      </section>
    )
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

  function renderizarNotificacoes() {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setNotificacoesAbertas((abertas) => !abertas)
            carregarNotificacoes()
          }}
          aria-label={`Notificações: ${totalNaoLidas} não lidas`}
          aria-expanded={notificacoesAbertas}
          title="Notificações"
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#171717',
            background: notificacoesAbertas ? '#fff5c7' : '#fff',
            border: '1px solid #e5e5df',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 21h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>

          {totalNaoLidas > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                minWidth: '19px',
                height: '19px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                color: '#171717',
                background: '#ffd000',
                border: '2px solid #fff',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 850
              }}
            >
              {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
            </span>
          )}
        </button>

        {notificacoesAbertas && (
          <div
            style={{
              position: 'absolute',
              zIndex: 1000,
              top: '49px',
              right: 0,
              width: 'min(360px, calc(100vw - 30px))',
              maxHeight: '430px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#fff',
              border: '1px solid #e9e9e3',
              borderRadius: '12px',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.13)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '16px',
                borderBottom: '1px solid #eeeeea'
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    color: '#171717',
                    fontSize: '14px'
                  }}
                >
                  Notificações
                </strong>

                <span
                  style={{
                    display: 'block',
                    marginTop: '4px',
                    color: '#777',
                    fontSize: '11px'
                  }}
                >
                  {totalNaoLidas} não lida(s)
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px'
                }}
              >
                {totalNaoLidas > 0 && (
                  <button
                    type="button"
                    onClick={marcarTodasComoLidas}
                    disabled={marcandoTodasComoLidas}
                    title="Marcar todas como lidas"
                    style={{
                      padding: '7px 9px',
                      color: '#333',
                      background: '#fff5c7',
                      border: '1px solid #f0d45a',
                      borderRadius: '7px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: marcandoTodasComoLidas ? 'wait' : 'pointer',
                      opacity: marcandoTodasComoLidas ? 0.6 : 1
                    }}
                  >
                    {marcandoTodasComoLidas
                      ? 'Atualizando...'
                      : 'Marcar todas como lidas'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={carregarNotificacoes}
                  title="Atualizar notificações"
                  style={{
                    padding: '7px 10px',
                    color: '#333',
                    background: '#f7f7f4',
                    border: '1px solid #e9e9e3',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ↻ Atualizar
                </button>
              </div>
            </div>

            {erroNotificacoes && (
              <p
                style={{
                  margin: 0,
                  padding: '12px 15px',
                  color: '#a12d2d',
                  fontSize: '11px'
                }}
              >
                {erroNotificacoes}
              </p>
            )}

            <div
              style={{
                overflowY: 'auto',
                padding: '7px'
              }}
            >
              {notificacoes.length === 0 ? (
                <div
                  style={{
                    padding: '28px 15px',
                    color: '#777',
                    textAlign: 'center',
                    fontSize: '12px'
                  }}
                >
                  Nenhuma notificação encontrada.
                </div>
              ) : (
                notificacoes.map((notificacao) => (
                  <article
                    key={notificacao.id}
                    style={{
                      padding: '13px',
                      marginBottom: '5px',
                      background: notificacao.lida ? '#fff' : '#fff9df',
                      border: '1px solid',
                      borderColor: notificacao.lida ? '#f0f0eb' : '#f2df91',
                      borderRadius: '9px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '6px'
                      }}
                    >
                      <strong
                        style={{
                          color: '#242424',
                          fontSize: '12px'
                        }}
                      >
                        {notificacao.titulo}
                      </strong>

                      {!notificacao.lida && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            flexShrink: 0,
                            background: '#d5a900',
                            borderRadius: '50%'
                          }}
                          title="Não lida"
                        />
                      )}
                    </div>

                    <p
                      style={{
                        margin: '0 0 8px',
                        color: '#555',
                        fontSize: '11px',
                        lineHeight: 1.6
                      }}
                    >
                      {notificacao.mensagem}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span
                        style={{
                          color: '#888',
                          fontSize: '10px'
                        }}
                      >
                        {formatarDataHora(notificacao.created_at)}
                      </span>

                      {!notificacao.lida && (
                        <button
                          type="button"
                          onClick={() => marcarNotificacaoComoLida(notificacao)}
                          disabled={
                            notificacaoEmProcessamento === notificacao.id ||
                            marcandoTodasComoLidas
                          }
                          style={{
                            padding: '6px 9px',
                            color: '#765c00',
                            background: '#fff5c7',
                            border: '1px solid #f0d45a',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            opacity:
                              notificacaoEmProcessamento === notificacao.id ||
                              marcandoTodasComoLidas
                                ? 0.6
                                : 1
                          }}
                        >
                          {notificacaoEmProcessamento === notificacao.id
                            ? 'Atualizando...'
                            : 'Marcar como lida'}
                        </button>
                      )}

                      {notificacao.lida && (
                        <span
                          style={{
                            color: '#777',
                            fontSize: '10px',
                            fontWeight: 650
                          }}
                        >
                          ✓ Lida
                        </span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </div>
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
            {renderizarNotificacoes()}

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
          ) : secaoAtiva === 'convite' ? (
            renderizarConvite()
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
