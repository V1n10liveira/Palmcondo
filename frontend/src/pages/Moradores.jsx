
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './Moradores.css'

const DDD_VALIDOS = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function formatarDataExibicao(valor) {
  if (!valor) return ''

  const [ano, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataCampo(valor) {
  if (!valor) return ''

  return String(valor).slice(0, 10)
}

function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11)

  if (!numeros) return ''
  if (numeros.length <= 2) return `(${numeros}`

  const ddd = numeros.slice(0, 2)
  const restante = numeros.slice(2)

  if (restante.length <= 4) {
    return `(${ddd}) ${restante}`
  }

  if (numeros.length <= 10) {
    return `(${ddd}) ${restante.slice(0, 4)}-${restante.slice(4)}`
  }

  return `(${ddd}) ${restante.slice(0, 5)}-${restante.slice(5)}`
}

function validarTelefone(valor) {
  const numeros = valor.replace(/\D/g, '')

  if (!numeros) return true
  if (numeros.length !== 10 && numeros.length !== 11) return false

  const ddd = numeros.slice(0, 2)
  const numero = numeros.slice(2)

  if (!DDD_VALIDOS.includes(ddd)) return false

  if (numeros.length === 10) {
    return /^[2-5]\d{7}$/.test(numero)
  }

  return /^9\d{8}$/.test(numero)
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 3v4M8 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SetaCalendario({ direcao }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direcao === 'anterior' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Calendario({ valor, aoSelecionar, aoFechar }) {
  const hoje = new Date()
  const [mesExibido, setMesExibido] = useState(() => {
    if (valor) {
      const [ano, mes] = valor.split('-').map(Number)
      return new Date(ano, mes - 1, 1)
    }

    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })

  const primeiroDia = new Date(
    mesExibido.getFullYear(),
    mesExibido.getMonth(),
    1
  ).getDay()

  const quantidadeDias = new Date(
    mesExibido.getFullYear(),
    mesExibido.getMonth() + 1,
    0
  ).getDate()

  const dias = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: quantidadeDias }, (_, indice) => indice + 1),
  ]

  function alterarMes(direcao) {
    setMesExibido((anterior) => (
      new Date(
        anterior.getFullYear(),
        anterior.getMonth() + direcao,
        1
      )
    ))
  }

  function selecionarDia(dia) {
    const data = new Date(
      mesExibido.getFullYear(),
      mesExibido.getMonth(),
      dia
    )

    aoSelecionar(formatarDataISO(data))
    aoFechar()
  }

  function voltarParaHoje() {
    setMesExibido(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  }

  return (
    <div className="moradores-calendario">
      <div className="moradores-calendario-topo">
        <div>
          <span className="moradores-calendario-legenda">
            SELECIONE UMA DATA
          </span>

          <strong>
            {NOMES_MESES[mesExibido.getMonth()]} {mesExibido.getFullYear()}
          </strong>
        </div>

        <div className="moradores-calendario-navegacao">
          <button
            type="button"
            onClick={() => alterarMes(-1)}
            aria-label="Mês anterior"
          >
            <SetaCalendario direcao="anterior" />
          </button>

          <button
            type="button"
            onClick={() => alterarMes(1)}
            aria-label="Próximo mês"
          >
            <SetaCalendario direcao="proximo" />
          </button>
        </div>
      </div>

      <div className="moradores-calendario-grade">
        {DIAS_SEMANA.map((dia) => (
          <span
            className="moradores-calendario-dia-semana"
            key={dia}
          >
            {dia}
          </span>
        ))}

        {dias.map((dia, indice) => {
          if (!dia) {
            return (
              <span
                className="moradores-calendario-vazio"
                key={`vazio-${indice}`}
              />
            )
          }

          const dataAtual = new Date(
            mesExibido.getFullYear(),
            mesExibido.getMonth(),
            dia
          )

          const selecionado = valor === formatarDataISO(dataAtual)
          const ehHoje = formatarDataISO(dataAtual) === formatarDataISO(hoje)

          return (
            <button
              type="button"
              key={dia}
              className={[
                'moradores-calendario-dia',
                selecionado ? 'selecionado' : '',
                ehHoje ? 'hoje' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => selecionarDia(dia)}
              aria-label={`${dia} de ${NOMES_MESES[mesExibido.getMonth()]}`}
              aria-pressed={selecionado}
            >
              {dia}
            </button>
          )
        })}
      </div>

      <div className="moradores-calendario-rodape">
        <button
          type="button"
          className="moradores-calendario-limpar"
          onClick={() => {
            aoSelecionar('')
            aoFechar()
          }}
        >
          Limpar data
        </button>

        <button
          type="button"
          className="moradores-calendario-hoje"
          onClick={voltarParaHoje}
        >
          Ir para hoje
        </button>
      </div>
    </div>
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

function IconeSair() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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

const FORMULARIO_INICIAL = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  senha: '',
  apartamento_id: '',
  data_entrada: '',
}

const FORMULARIO_EDICAO_INICIAL = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  apartamento_id: '',
  data_entrada: '',
}

function Moradores() {
  const navigate = useNavigate()
  const usuario = api.obterUsuario()

  const [moradores, setMoradores] = useState([])
  const [apartamentos, setApartamentos] = useState([])
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [formularioEdicao, setFormularioEdicao] = useState(
    FORMULARIO_EDICAO_INICIAL
  )
  const [moradorEditando, setMoradorEditando] = useState(null)
  const [pesquisa, setPesquisa] = useState('')

  const [calendarioAberto, setCalendarioAberto] = useState(false)
  const [calendarioEdicaoAberto, setCalendarioEdicaoAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true)
      setErro('')

      const [respostaMoradores, respostaApartamentos] = await Promise.all([
        api.get('/moradores'),
        api.get('/apartamentos'),
      ])

      setMoradores(respostaMoradores.moradores || [])
      setApartamentos(respostaApartamentos.apartamentos || [])
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar os dados.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  function handleLogout() {
    api.limparSessao()
    navigate('/login', { replace: true })
  }

  function handleChange(event) {
    const { name, value } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: name === 'telefone'
        ? formatarTelefone(value)
        : value,
    }))
  }

  function handleChangeEdicao(event) {
    const { name, value } = event.target

    setFormularioEdicao((anterior) => ({
      ...anterior,
      [name]: name === 'telefone'
        ? formatarTelefone(value)
        : value,
    }))
  }

  function abrirEdicao(morador) {
    setErro('')
    setSucesso('')
    setCalendarioEdicaoAberto(false)

    setFormularioEdicao({
      nome: morador.usuario?.nome || '',
      email: morador.usuario?.email || '',
      cpf: morador.usuario?.cpf || '',
      telefone: formatarTelefone(morador.usuario?.telefone || ''),
      apartamento_id: String(morador.apartamento_id || ''),
      data_entrada: formatarDataCampo(morador.data_entrada),
    })

    setMoradorEditando(morador)
  }

  function fecharEdicao() {
    if (salvandoEdicao) return

    setMoradorEditando(null)
    setFormularioEdicao(FORMULARIO_EDICAO_INICIAL)
    setCalendarioEdicaoAberto(false)
  }

  async function handleSalvarEdicao(event) {
    event.preventDefault()

    if (!moradorEditando) return

    if (!validarTelefone(formularioEdicao.telefone)) {
      setErro(
        'Telefone inválido. Informe um telefone fixo ou celular com DDD válido.'
      )
      return
    }

    try {
      setSalvandoEdicao(true)
      setErro('')
      setSucesso('')

      const telefoneNumeros = formularioEdicao.telefone.replace(/\D/g, '')

      const dados = {
        nome: formularioEdicao.nome.trim(),
        email: formularioEdicao.email.trim(),
        cpf: formularioEdicao.cpf.replace(/\D/g, ''),
        telefone: telefoneNumeros || null,
        apartamento_id: formularioEdicao.apartamento_id,
        data_entrada: formularioEdicao.data_entrada || null,
      }

      const resposta = await api.put(
        `/moradores/${moradorEditando.id}`,
        dados
      )

      setMoradorEditando(null)
      setFormularioEdicao(FORMULARIO_EDICAO_INICIAL)
      setCalendarioEdicaoAberto(false)

      await carregarDados()

      setSucesso(
        resposta.mensagem || 'Morador atualizado com sucesso.'
      )
    } catch (error) {
      setErro(error.message || 'Não foi possível atualizar o morador.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const telefoneNumeros = formulario.telefone.replace(/\D/g, '')

    if (!validarTelefone(formulario.telefone)) {
      setErro(
        'Telefone inválido. Informe um telefone fixo ou celular com DDD válido.'
      )
      setSucesso('')
      return
    }

    try {
      setSalvando(true)
      setErro('')
      setSucesso('')

      const dados = {
        nome: formulario.nome.trim(),
        email: formulario.email.trim(),
        cpf: formulario.cpf.trim(),
        telefone: telefoneNumeros || null,
        senha: formulario.senha,
        apartamento_id: formulario.apartamento_id,
        ...(formulario.data_entrada && {
          data_entrada: formulario.data_entrada,
        }),
      }

      const resposta = await api.post('/moradores', dados)

      setSucesso(
        resposta.mensagem || 'Morador cadastrado com sucesso.'
      )

      setFormulario(FORMULARIO_INICIAL)
      await carregarDados()
    } catch (error) {
      setErro(error.message || 'Não foi possível cadastrar o morador.')
    } finally {
      setSalvando(false)
    }
  }

  const moradoresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    if (!termo) return moradores

    return moradores.filter((morador) => {
      const nome = morador.usuario?.nome || ''
      const bloco = morador.apartamento?.bloco || ''
      const numero = morador.apartamento?.numero || ''

      return (
        nome.toLowerCase().includes(termo) ||
        bloco.toLowerCase().includes(termo) ||
        String(numero).toLowerCase().includes(termo)
      )
    })
  }, [moradores, pesquisa])

  const inicialUsuario = (usuario?.nome || 'U')
    .charAt(0)
    .toUpperCase()

  function identificarApartamento(apartamento) {
    if (!apartamento) return 'Apartamento não identificado'

    const bloco = apartamento.bloco
      ? `Bloco ${apartamento.bloco}`
      : ''

    const numero = apartamento.numero
      ? `Apartamento ${apartamento.numero}`
      : ''

    return [bloco, numero].filter(Boolean).join(' - ')
  }

  return (
    <main className="painel-layout">
      <aside className="painel-sidebar">
        <Link
          to="/painel"
          className="painel-brand"
          aria-label="PalmCondo - início"
        >
          <span className="painel-brand-icon">
            <LockIcon />
          </span>

          <span>
            Palm<span>Condo</span>
          </span>
        </Link>

        <div className="painel-menu-label">
          MENU PRINCIPAL
        </div>

        <nav className="painel-navigation">
          <Link to="/painel" className="painel-nav-item">
            <span>▦</span>
            Visão geral
          </Link>

          <div className="painel-nav-item active">
            <span>♙</span>
            Gestão de moradores
          </div>
        </nav>
      </aside>

      <section className="painel-main">
        <header className="painel-topbar">
          <div>
            <span className="painel-breadcrumb">
              PalmCondo / Área administrativa / Moradores
            </span>

            <h1>Gestão de moradores</h1>
          </div>

          <div className="painel-topbar-user">
            <div className="painel-avatar">
              {inicialUsuario}
            </div>

            <span className="painel-topbar-user-name">
              {usuario?.nome || 'Usuário'}
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

        <div className="moradores-content">
          <section className="moradores-welcome">
            <span className="moradores-eyebrow">
              ADMINISTRAÇÃO DO CONDOMÍNIO
            </span>

            <h2>Moradores</h2>

            <p>
              Consulte e cadastre os moradores vinculados aos apartamentos
              do seu condomínio.
            </p>
          </section>

          <section className="moradores-form-card">
            <div className="moradores-section-heading">
              <div>
                <h2>Cadastrar morador</h2>
                <p>
                  Cadastre os dados pessoais e crie a conta de acesso.
                </p>
              </div>
            </div>

            {erro && (
              <div className="moradores-alerta erro" role="alert">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="moradores-alerta sucesso" role="status">
                {sucesso}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="moradores-form-grid">
                <div className="moradores-field moradores-field-full">
                  <label htmlFor="nome">Nome completo *</label>

                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formulario.nome}
                    onChange={handleChange}
                    placeholder="Digite o nome completo"
                    maxLength={150}
                    required
                  />
                </div>

                <div className="moradores-field">
                  <label htmlFor="cpf">CPF *</label>

                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formulario.cpf}
                    onChange={handleChange}
                    placeholder="Digite o CPF"
                    maxLength={14}
                    required
                  />
                </div>

                <div className="moradores-field">
                  <label htmlFor="telefone">Telefone</label>

                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={formulario.telefone}
                    onChange={handleChange}
                    placeholder="(51) 99999-9999"
                    maxLength={15}
                    aria-invalid={
                      formulario.telefone.length > 0 &&
                      !validarTelefone(formulario.telefone)
                    }
                  />

                  <small>
                    Informe o DDD e o número fixo ou celular.
                  </small>
                </div>

                <div className="moradores-field moradores-field-full">
                  <label htmlFor="email">E-mail *</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={handleChange}
                    placeholder="exemplo@email.com"
                    required
                  />
                </div>

                <div className="moradores-field">
                  <label htmlFor="senha">Senha inicial *</label>

                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    value={formulario.senha}
                    onChange={handleChange}
                    placeholder="Mínimo de 8 caracteres"
                    minLength={8}
                    required
                  />

                  <small>
                    A senha será utilizada no primeiro acesso.
                  </small>
                </div>

                <div className="moradores-field">
                  <label htmlFor="apartamento_id">Apartamento *</label>

                  <select
                    id="apartamento_id"
                    name="apartamento_id"
                    value={formulario.apartamento_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione um apartamento</option>

                    {apartamentos.map((apartamento) => (
                      <option
                        key={apartamento.id}
                        value={apartamento.id}
                      >
                        {identificarApartamento(apartamento)}
                      </option>
                    ))}
                  </select>

                  {apartamentos.length === 0 && !carregando && (
                    <small>
                      Nenhum apartamento ativo disponível.
                    </small>
                  )}
                </div>

                <div className="moradores-field">
                  <label htmlFor="data_entrada">Data de entrada</label>

                  <div className="moradores-calendario-container">
                    <button
                      type="button"
                      id="data_entrada"
                      className={`moradores-calendario-campo ${
                        calendarioAberto ? 'aberto' : ''
                      }`}
                      onClick={() => setCalendarioAberto((anterior) => !anterior)}
                      aria-expanded={calendarioAberto}
                      aria-haspopup="dialog"
                    >
                      <span className={
                        formulario.data_entrada
                          ? 'moradores-calendario-valor'
                          : 'moradores-calendario-placeholder'
                      }>
                        {formulario.data_entrada
                          ? formatarDataExibicao(formulario.data_entrada)
                          : 'Selecione uma data'}
                      </span>

                      <IconeCalendario />
                    </button>

                    {calendarioAberto && (
                      <Calendario
                        valor={formulario.data_entrada}
                        aoSelecionar={(data) => {
                          setFormulario((anterior) => ({
                            ...anterior,
                            data_entrada: data,
                          }))
                        }}
                        aoFechar={() => setCalendarioAberto(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="moradores-form-actions">
                <button
                  type="submit"
                  className="moradores-button-primary"
                  disabled={salvando || apartamentos.length === 0}
                >
                  {salvando ? 'Cadastrando...' : 'Cadastrar morador'}
                </button>
              </div>
            </form>
          </section>

          <section className="moradores-list-card">
            <div className="moradores-section-heading">
              <div>
                <h2>Moradores cadastrados</h2>
                <p>
                  Consulte os moradores vinculados ao condomínio.
                </p>
              </div>

              <button
                type="button"
                className="moradores-button-secondary"
                onClick={carregarDados}
                disabled={carregando}
              >
                ↻ {carregando ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>

            <div className="moradores-search">
              <input
                type="search"
                value={pesquisa}
                onChange={(event) => setPesquisa(event.target.value)}
                placeholder="Pesquisar por nome ou apartamento..."
                aria-label="Pesquisar moradores"
              />
            </div>

            {carregando ? (
              <div className="moradores-empty">
                Carregando moradores...
              </div>
            ) : moradoresFiltrados.length === 0 ? (
              <div className="moradores-empty">
                {pesquisa
                  ? 'Nenhum morador encontrado para essa pesquisa.'
                  : 'Ainda não existem moradores cadastrados.'}
              </div>
            ) : (
              <div className="moradores-table-wrapper">
                <table className="moradores-table">
                  <thead>
                    <tr>
                      <th>Morador</th>
                      <th>Apartamento</th>
                      <th>Situação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {moradoresFiltrados.map((morador) => {
                      const ativo =
                        morador.ativo && morador.usuario?.ativo

                      return (
                        <tr key={morador.id}>
                          <td>
                            <strong>
                              {morador.usuario?.nome || 'Nome não informado'}
                            </strong>
                          </td>

                          <td>
                            {identificarApartamento(morador.apartamento)}
                          </td>

                          <td>
                            <span
                              className={`moradores-status ${
                                ativo ? 'ativo' : 'inativo'
                              }`}
                            >
                              {ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="moradores-button-secondary"
                              onClick={() => abrirEdicao(morador)}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!carregando && moradores.length > 0 && (
              <div className="moradores-total">
                {moradoresFiltrados.length} de {moradores.length} moradores
              </div>
            )}
          </section>
        </div>

        <footer className="painel-footer">
          <span>PalmCondo © 2026</span>
          <span>Controle de acesso inteligente</span>
        </footer>
      </section>

      {moradorEditando && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharEdicao()
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-edicao-morador"
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2
                  id="titulo-edicao-morador"
                  style={{ margin: 0, fontSize: '22px', color: '#171717' }}
                >
                  Editar morador
                </h2>

                <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                  Atualize os dados cadastrais do morador.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharEdicao}
                disabled={salvandoEdicao}
                aria-label="Fechar edição"
                style={{
                  border: 0,
                  background: 'transparent',
                  fontSize: '26px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: '#555',
                }}
              >
                ×
              </button>
            </div>

            {erro && (
              <div className="moradores-alerta erro" role="alert">
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvarEdicao}>
              <div className="moradores-form-grid">
                <div className="moradores-field moradores-field-full">
                  <label htmlFor="edicao_nome">Nome completo *</label>

                  <input
                    id="edicao_nome"
                    name="nome"
                    type="text"
                    value={formularioEdicao.nome}
                    onChange={handleChangeEdicao}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="moradores-field">
                  <label htmlFor="edicao_cpf">CPF</label>

                  <input
                    id="edicao_cpf"
                    name="cpf"
                    type="text"
                    value={formularioEdicao.cpf}
                    readOnly
                    aria-readonly="true"
                    title="O CPF não pode ser alterado após o cadastro."
                  />

                  <small>
                    O CPF é um identificador permanente e não pode ser alterado.
                  </small>
                </div>

                <div className="moradores-field">
                  <label htmlFor="edicao_telefone">Telefone</label>

                  <input
                    id="edicao_telefone"
                    name="telefone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={formularioEdicao.telefone}
                    onChange={handleChangeEdicao}
                    placeholder="(51) 99999-9999"
                    maxLength={15}
                    aria-invalid={
                      formularioEdicao.telefone.length > 0 &&
                      !validarTelefone(formularioEdicao.telefone)
                    }
                  />

                  <small>
                    Informe o DDD e o número fixo ou celular.
                  </small>
                </div>

                <div className="moradores-field moradores-field-full">
                  <label htmlFor="edicao_email">E-mail *</label>

                  <input
                    id="edicao_email"
                    name="email"
                    type="email"
                    value={formularioEdicao.email}
                    onChange={handleChangeEdicao}
                    required
                  />
                </div>

                <div className="moradores-field">
                  <label htmlFor="edicao_apartamento_id">Apartamento *</label>

                  <select
                    id="edicao_apartamento_id"
                    name="apartamento_id"
                    value={formularioEdicao.apartamento_id}
                    onChange={handleChangeEdicao}
                    required
                  >
                    <option value="">Selecione um apartamento</option>

                    {apartamentos.map((apartamento) => (
                      <option
                        key={apartamento.id}
                        value={apartamento.id}
                      >
                        {identificarApartamento(apartamento)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="moradores-field">
                  <label htmlFor="edicao_data_entrada">Data de entrada</label>

                  <div className="moradores-calendario-container">
                    <button
                      type="button"
                      id="edicao_data_entrada"
                      className={`moradores-calendario-campo ${
                        calendarioEdicaoAberto ? 'aberto' : ''
                      }`}
                      onClick={() => setCalendarioEdicaoAberto((anterior) => !anterior)}
                      aria-expanded={calendarioEdicaoAberto}
                      aria-haspopup="dialog"
                    >
                      <span className={
                        formularioEdicao.data_entrada
                          ? 'moradores-calendario-valor'
                          : 'moradores-calendario-placeholder'
                      }>
                        {formularioEdicao.data_entrada
                          ? formatarDataExibicao(formularioEdicao.data_entrada)
                          : 'Selecione uma data'}
                      </span>

                      <IconeCalendario />
                    </button>

                    {calendarioEdicaoAberto && (
                      <Calendario
                        valor={formularioEdicao.data_entrada}
                        aoSelecionar={(data) => {
                          setFormularioEdicao((anterior) => ({
                            ...anterior,
                            data_entrada: data,
                          }))
                        }}
                        aoFechar={() => setCalendarioEdicaoAberto(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '28px',
                }}
              >
                <button
                  type="button"
                  className="moradores-button-secondary"
                  onClick={fecharEdicao}
                  disabled={salvandoEdicao}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="moradores-button-primary"
                  disabled={salvandoEdicao}
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default Moradores
