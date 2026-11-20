
const prisma = require('../lib/prisma');

const {
    gerarTokenAcompanhamento,
    gerarHashToken,
    gerarCodigoLiberacao,
    gerarHashCodigo,
    criptografarCodigo,
    descriptografarCodigo
} = require('../utils/solicitacao-seguranca');

const TEMPO_AUTORIZACAO_HORAS = 24;
const TEMPO_AUTORIZACAO_MS = TEMPO_AUTORIZACAO_HORAS * 60 * 60 * 1000;

const TIPOS_PESSOA_PERMITIDOS = ['VISITANTE', 'PRESTADOR'];

// Valida matematicamente os dígitos verificadores do CPF.
function validarCPF(cpf) {
    if (!/^\d{11}$/.test(cpf)) {
        return false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calcularDigito = (base, pesoInicial) => {
        let soma = 0;

        for (let i = 0; i < base.length; i++) {
            soma += Number(base[i]) * (pesoInicial - i);
        }

        const resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroDigito = calcularDigito(
        cpf.substring(0, 9),
        10
    );

    if (primeiroDigito !== Number(cpf[9])) {
        return false;
    }

    const segundoDigito = calcularDigito(
        cpf.substring(0, 10),
        11
    );

    return segundoDigito === Number(cpf[10]);
}

// Converte IDs positivos para BigInt.
function converterId(valor) {
    if (
        valor === undefined ||
        valor === null ||
        !/^[1-9]\d*$/.test(String(valor))
    ) {
        return null;
    }

    try {
        return BigInt(valor);
    } catch {
        return null;
    }
}

// Calcula a data de expiração de uma autorização.
function calcularExpiracao(dataAprovacao) {
    return new Date(
        new Date(dataAprovacao).getTime() + TEMPO_AUTORIZACAO_MS
    );
}

// Recupera o código de liberação sem expor o conteúdo criptografado.
function obterCodigoLiberacao(solicitacao) {
    if (
        solicitacao.status !== 'AUTORIZADA' ||
        !solicitacao.codigo_liberacao_criptografado
    ) {
        return null;
    }

    const agora = new Date();

    const dataExpiracao = solicitacao.codigo_expira_em
        ? solicitacao.codigo_expira_em
        : calcularExpiracao(solicitacao.data_hora_resposta);

    if (!dataExpiracao || dataExpiracao <= agora) {
        return null;
    }

    try {
        return descriptografarCodigo(
            solicitacao.codigo_liberacao_criptografado
        );
    } catch (error) {
        console.error(
            'ERRO AO DESCRIPTOGRAFAR CÓDIGO DE LIBERAÇÃO:',
            error
        );

        return null;
    }
}

// Expira autorizações vencidas de visitantes e prestadores.
async function expirarSolicitacoesVencidas(filtros = {}) {
    const agora = new Date();

    const limiteExpiracao = new Date(
        agora.getTime() - TEMPO_AUTORIZACAO_MS
    );

    return prisma.solicitacoes_acesso.updateMany({
        where: {
            ...filtros,
            tipo_pessoa: {
                in: TIPOS_PESSOA_PERMITIDOS
            },
            status: 'AUTORIZADA',
            OR: [
                {
                    codigo_expira_em: {
                        lte: agora
                    }
                },
                {
                    codigo_expira_em: null,
                    data_hora_resposta: {
                        lte: limiteExpiracao
                    }
                }
            ]
        },
        data: {
            status: 'EXPIRADA'
        }
    });
}

// CRIAR SOLICITAÇÃO PÚBLICA DE ACESSO.
async function criarSolicitacaoPublica(req, res) {
    try {
        const {
            codigo_publico,
            tipo_pessoa,
            nome,
            cpf,
            apartamento_destino_id,
            mensagem
        } = req.body || {};

        if (
            !codigo_publico ||
            !tipo_pessoa ||
            !nome ||
            !cpf ||
            !apartamento_destino_id
        ) {
            return res.status(400).json({
                erro: 'Código do condomínio, tipo de acesso, nome, CPF e apartamento são obrigatórios.'
            });
        }

        const codigoLimpo = String(codigo_publico)
            .trim()
            .toUpperCase();

        const tipoPessoaLimpo = String(tipo_pessoa)
            .trim()
            .toUpperCase();

        const nomeLimpo = String(nome).trim();
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const apartamentoId = converterId(apartamento_destino_id);

        const mensagemLimpa =
            mensagem === undefined ||
            mensagem === null ||
            mensagem === ''
                ? null
                : String(mensagem).trim();

        if (!codigoLimpo || codigoLimpo.length > 64) {
            return res.status(400).json({
                erro: 'Código público do condomínio inválido.'
            });
        }

        if (!TIPOS_PESSOA_PERMITIDOS.includes(tipoPessoaLimpo)) {
            return res.status(400).json({
                erro: 'Tipo de acesso inválido. Utilize VISITANTE ou PRESTADOR.'
            });
        }

        if (!nomeLimpo) {
            return res.status(400).json({
                erro: 'O nome não pode ficar vazio.'
            });
        }

        if (nomeLimpo.length > 150) {
            return res.status(400).json({
                erro: 'O nome deve possuir no máximo 150 caracteres.'
            });
        }

        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({
                erro: 'CPF inválido. Verifique os números e os dígitos verificadores.'
            });
        }

        if (!apartamentoId) {
            return res.status(400).json({
                erro: 'Apartamento de destino inválido.'
            });
        }

        if (mensagemLimpa && mensagemLimpa.length > 100) {
            return res.status(400).json({
                erro: 'A mensagem deve possuir no máximo 100 caracteres.'
            });
        }

        const condominio = await prisma.condominios.findUnique({
            where: {
                codigo_publico: codigoLimpo
            },
            select: {
                id: true,
                ativo: true
            }
        });

        if (!condominio || !condominio.ativo) {
            return res.status(404).json({
                erro: 'Condomínio não encontrado ou inativo.'
            });
        }

        const apartamento = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominio.id,
                ativo: true,
                moradores: {
                    some: {
                        ativo: true,
                        usuarios: {
                            ativo: true,
                            tipo_usuario: 'MORADOR'
                        }
                    }
                }
            },
            select: {
                id: true,
                bloco: true,
                numero: true
            }
        });

        if (!apartamento) {
            return res.status(400).json({
                erro: 'Apartamento indisponível para receber solicitações.'
            });
        }

        // O token original será entregue uma única vez.
        // Somente seu hash será armazenado no banco.
        const tokenAcompanhamento = gerarTokenAcompanhamento();
        const tokenHash = gerarHashToken(tokenAcompanhamento);

        const solicitacao = await prisma.solicitacoes_acesso.create({
            data: {
                condominio_id: condominio.id,
                nome: nomeLimpo,
                cpf: cpfLimpo,
                tipo_pessoa: tipoPessoaLimpo,
                apartamento_destino_id: apartamento.id,
                mensagem: mensagemLimpa,
                token_acompanhamento_hash: tokenHash,
                status: 'PENDENTE'
            },
            select: {
                id: true,
                nome: true,
                tipo_pessoa: true,
                apartamento_destino_id: true,
                mensagem: true,
                status: true,
                data_hora_solicitacao: true
            }
        });

        // Cria uma notificação individual para cada morador ativo.
        // Uma falha nesta etapa não invalida a solicitação.
        try {
            const moradores = await prisma.moradores.findMany({
                where: {
                    apartamento_id: apartamento.id,
                    ativo: true,
                    apartamentos: {
                        condominio_id: condominio.id,
                        ativo: true
                    },
                    usuarios: {
                        ativo: true,
                        tipo_usuario: 'MORADOR',
                        condominio_id: condominio.id
                    }
                },
                select: {
                    usuario_id: true
                }
            });

            if (moradores.length > 0) {
                const tipoDescricao = tipoPessoaLimpo === 'VISITANTE'
                    ? 'visitante'
                    : 'prestador';

                const identificacaoApartamento = apartamento.bloco
                    ? `${apartamento.bloco}-${apartamento.numero}`
                    : apartamento.numero;

                await prisma.notificacoes.createMany({
                    data: moradores.map((morador) => ({
                        usuario_id: morador.usuario_id,
                        titulo: 'Nova solicitação de acesso',
                        mensagem: `${nomeLimpo} enviou uma solicitação de acesso como ${tipoDescricao} para o apartamento ${identificacaoApartamento}.`,
                        tipo: 'SOLICITACAO_ACESSO',
                        lida: false
                    }))
                });
            }
        } catch (erroNotificacao) {
            console.error(
                'ERRO AO CRIAR NOTIFICAÇÕES DA SOLICITAÇÃO:',
                erroNotificacao
            );
        }

        return res.status(201).json({
            mensagem: 'Solicitação de acesso enviada com sucesso.',
            token_acompanhamento: tokenAcompanhamento,
            solicitacao: {
                id: String(solicitacao.id),
                nome: solicitacao.nome,
                tipo_pessoa: solicitacao.tipo_pessoa,
                apartamento: {
                    id: String(apartamento.id),
                    bloco: apartamento.bloco,
                    numero: apartamento.numero
                },
                mensagem: solicitacao.mensagem,
                status: solicitacao.status,
                data_hora_solicitacao: solicitacao.data_hora_solicitacao
            }
        });

    } catch (error) {
        console.error('ERRO AO CRIAR SOLICITAÇÃO PÚBLICA:', error);

        return res.status(500).json({
            erro: 'Erro ao registrar solicitação de acesso.'
        });
    }
}

// CRIAR CONVITE DE ACESSO PELO MORADOR.
async function criarConviteMorador(req, res) {
    try {
        const condominioId = converterId(req.user?.condominio_id);
        const usuarioId = converterId(req.user?.id);

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (req.user.tipo_usuario !== 'MORADOR') {
            return res.status(403).json({
                erro: 'Apenas moradores podem criar convites.'
            });
        }

        const {
            tipo_pessoa,
            nome,
            cpf
        } = req.body || {};

        if (!tipo_pessoa || !nome || !cpf) {
            return res.status(400).json({
                erro: 'Tipo de acesso, nome e CPF são obrigatórios.'
            });
        }

        const tipoPessoaLimpo = String(tipo_pessoa)
            .trim()
            .toUpperCase();

        const nomeLimpo = String(nome).trim();
        const cpfLimpo = String(cpf).replace(/\D/g, '');

        if (!TIPOS_PESSOA_PERMITIDOS.includes(tipoPessoaLimpo)) {
            return res.status(400).json({
                erro: 'Tipo de acesso inválido. Utilize VISITANTE ou PRESTADOR.'
            });
        }

        if (!nomeLimpo || nomeLimpo.length > 150) {
            return res.status(400).json({
                erro: 'O nome deve possuir entre 1 e 150 caracteres.'
            });
        }

        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({
                erro: 'CPF inválido. Verifique os números e os dígitos verificadores.'
            });
        }

        // Confirma o condomínio e recupera seu código público.
        const condominio = await prisma.condominios.findFirst({
            where: {
                id: condominioId,
                ativo: true
            },
            select: {
                id: true,
                codigo_publico: true
            }
        });

        if (!condominio || !condominio.codigo_publico) {
            return res.status(404).json({
                erro: 'Condomínio não encontrado, inativo ou sem código público.'
            });
        }

        // Identifica o morador e seu apartamento pelo usuário autenticado.
        const morador = await prisma.moradores.findFirst({
            where: {
                usuario_id: usuarioId,
                ativo: true,
                apartamentos: {
                    condominio_id: condominioId,
                    ativo: true
                }
            },
            select: {
                id: true,
                apartamento_id: true,
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true
                    }
                }
            }
        });

        if (!morador || !morador.apartamentos) {
            return res.status(404).json({
                erro: 'Cadastro de morador ou apartamento não encontrado ou inativo.'
            });
        }

        const dataHoraResposta = new Date();
        const codigoExpiraEm = calcularExpiracao(dataHoraResposta);

        let conviteCriado = null;
        let tokenAcompanhamento = null;
        let codigoLiberacao = null;

        // Cada convite é independente.
        // Nome e CPF podem se repetir sem restrição entre convites.
        // Não consultamos nem criamos registros na tabela pessoas.
        for (let tentativa = 0; tentativa < 5; tentativa++) {
            const token = gerarTokenAcompanhamento();
            const tokenHash = gerarHashToken(token);

            const codigo = gerarCodigoLiberacao();
            const codigoHash = gerarHashCodigo(codigo);
            const codigoCriptografado = criptografarCodigo(codigo);

            try {
                conviteCriado = await prisma.solicitacoes_acesso.create({
                    data: {
                        condominio_id: condominioId,
                        nome: nomeLimpo,
                        cpf: cpfLimpo,
                        tipo_pessoa: tipoPessoaLimpo,
                        apartamento_destino_id: morador.apartamento_id,
                        status: 'AUTORIZADA',
                        respondido_por: usuarioId,
                        data_hora_resposta: dataHoraResposta,
                        token_acompanhamento_hash: tokenHash,
                        codigo_liberacao_hash: codigoHash,
                        codigo_liberacao_criptografado: codigoCriptografado,
                        codigo_expira_em: codigoExpiraEm
                    },
                    select: {
                        id: true,
                        nome: true,
                        cpf: true,
                        tipo_pessoa: true,
                        status: true,
                        data_hora_solicitacao: true,
                        data_hora_resposta: true,
                        codigo_expira_em: true
                    }
                });

                tokenAcompanhamento = token;
                codigoLiberacao = codigo;

                break;

            } catch (error) {
                if (
                    error.code === 'P2002' &&
                    tentativa < 4
                ) {
                    continue;
                }

                throw error;
            }
        }

        if (!conviteCriado) {
            throw new Error('Não foi possível gerar um convite único.');
        }

        return res.status(201).json({
            mensagem: 'Convite criado e autorizado com sucesso.',
            token_acompanhamento: tokenAcompanhamento,
            codigo_publico: condominio.codigo_publico,
            codigo_liberacao: codigoLiberacao,
            convite: {
                id: String(conviteCriado.id),
                nome: conviteCriado.nome,
                cpf: conviteCriado.cpf,
                tipo_pessoa: conviteCriado.tipo_pessoa,
                status: conviteCriado.status,
                data_hora_solicitacao: conviteCriado.data_hora_solicitacao,
                data_hora_resposta: conviteCriado.data_hora_resposta,
                codigo_expira_em: conviteCriado.codigo_expira_em,
                apartamento: {
                    id: String(morador.apartamentos.id),
                    bloco: morador.apartamentos.bloco,
                    numero: morador.apartamentos.numero
                }
            }
        });

    } catch (error) {
        console.error('ERRO AO CRIAR CONVITE DO MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao criar convite de acesso.'
        });
    }
}

// CONSULTAR SOLICITAÇÃO PÚBLICA PELO TOKEN PRIVADO.
async function consultarSolicitacaoPublica(req, res) {
    try {
        const token = String(req.params.token || '');

        if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
            return res.status(404).json({
                erro: 'Solicitação não encontrada.'
            });
        }

        const tokenHash = gerarHashToken(token);

        const solicitacao = await prisma.solicitacoes_acesso.findUnique({
            where: {
                token_acompanhamento_hash: tokenHash
            },
            select: {
                id: true,
                nome: true,
                cpf: true,
                tipo_pessoa: true,
                status: true,
                mensagem: true,
                data_hora_solicitacao: true,
                data_hora_resposta: true,
                codigo_expira_em: true,
                codigo_liberacao_criptografado: true,
                apartamentos: {
                    select: {
                        bloco: true,
                        numero: true
                    }
                }
            }
        });

        if (!solicitacao) {
            return res.status(404).json({
                erro: 'Solicitação não encontrada.'
            });
        }

        // Atualiza o status caso a autorização tenha vencido.
        if (solicitacao.status === 'AUTORIZADA') {
            const dataExpiracao = solicitacao.codigo_expira_em
                ? solicitacao.codigo_expira_em
                : calcularExpiracao(solicitacao.data_hora_resposta);

            if (!dataExpiracao || dataExpiracao <= new Date()) {
                await prisma.solicitacoes_acesso.updateMany({
                    where: {
                        id: solicitacao.id,
                        status: 'AUTORIZADA'
                    },
                    data: {
                        status: 'EXPIRADA'
                    }
                });

                solicitacao.status = 'EXPIRADA';
            }
        }

        const codigoLiberacao = obterCodigoLiberacao(solicitacao);

        return res.status(200).json({
            solicitacao: {
                nome: solicitacao.nome,
                cpf: solicitacao.cpf,
                tipo_pessoa: solicitacao.tipo_pessoa,
                status: solicitacao.status,
                mensagem: solicitacao.mensagem,
                data_hora_solicitacao: solicitacao.data_hora_solicitacao,
                data_hora_resposta: solicitacao.data_hora_resposta,
                codigo_liberacao: codigoLiberacao,
                codigo_expira_em: codigoLiberacao
                    ? solicitacao.codigo_expira_em || calcularExpiracao(solicitacao.data_hora_resposta)
                    : null,
                apartamento: solicitacao.apartamentos
                    ? {
                        bloco: solicitacao.apartamentos.bloco,
                        numero: solicitacao.apartamentos.numero
                    }
                    : null
            }
        });

    } catch (error) {
        console.error('ERRO AO CONSULTAR SOLICITAÇÃO PÚBLICA:', error);

        return res.status(500).json({
            erro: 'Erro ao consultar solicitação de acesso.'
        });
    }
}

// LISTAR SOLICITAÇÕES E AUTORIZAÇÕES DO MORADOR.
async function listarSolicitacoesMorador(req, res) {
    try {
        const condominioId = converterId(req.user?.condominio_id);
        const usuarioId = converterId(req.user?.id);

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (req.user.tipo_usuario !== 'MORADOR') {
            return res.status(403).json({
                erro: 'Apenas moradores podem consultar estas solicitações.'
            });
        }

        const morador = await prisma.moradores.findFirst({
            where: {
                usuario_id: usuarioId,
                ativo: true,
                apartamentos: {
                    condominio_id: condominioId,
                    ativo: true
                }
            },
            select: {
                id: true,
                apartamento_id: true,
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true
                    }
                }
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Cadastro de morador não encontrado ou inativo.'
            });
        }

        await expirarSolicitacoesVencidas({
            condominio_id: condominioId,
            apartamento_destino_id: morador.apartamento_id
        });

        const solicitacoes = await prisma.solicitacoes_acesso.findMany({
            where: {
                tipo_pessoa: {
                    in: TIPOS_PESSOA_PERMITIDOS
                },
                condominio_id: condominioId,
                apartamento_destino_id: morador.apartamento_id,
                status: {
                    in: [
                        'PENDENTE',
                        'AUTORIZADA',
                        'NEGADA',
                        'EXPIRADA',
                        'CANCELADA'
                    ]
                }
            },
            include: {
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true
                    }
                }
            },
            orderBy: {
                data_hora_solicitacao: 'desc'
            }
        });

        return res.status(200).json({
            total: solicitacoes.length,
            solicitacoes: solicitacoes.map((solicitacao) => ({
                id: String(solicitacao.id),
                nome: solicitacao.nome,
                cpf: solicitacao.cpf,
                tipo_pessoa: solicitacao.tipo_pessoa,
                mensagem: solicitacao.mensagem,
                status: solicitacao.status,
                data_hora_solicitacao: solicitacao.data_hora_solicitacao,
                data_hora_resposta: solicitacao.data_hora_resposta,
                validade_horas: solicitacao.status === 'AUTORIZADA'
                    ? TEMPO_AUTORIZACAO_HORAS
                    : null,
                codigo_liberacao: obterCodigoLiberacao(solicitacao),
                codigo_expira_em: obterCodigoLiberacao(solicitacao)
                    ? solicitacao.codigo_expira_em || calcularExpiracao(solicitacao.data_hora_resposta)
                    : null,
                apartamento: solicitacao.apartamentos
                    ? {
                        id: String(solicitacao.apartamentos.id),
                        bloco: solicitacao.apartamentos.bloco,
                        numero: solicitacao.apartamentos.numero
                    }
                    : null
            }))
        });

    } catch (error) {
        console.error('ERRO AO LISTAR SOLICITAÇÕES DO MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao listar solicitações de acesso.'
        });
    }
}

// APROVAR OU RECUSAR SOLICITAÇÃO DO MORADOR.
async function responderSolicitacaoMorador(req, res) {
    try {
        const condominioId = converterId(req.user?.condominio_id);
        const usuarioId = converterId(req.user?.id);
        const solicitacaoId = converterId(req.params.id);

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (req.user.tipo_usuario !== 'MORADOR') {
            return res.status(403).json({
                erro: 'Apenas moradores podem responder solicitações.'
            });
        }

        if (!solicitacaoId) {
            return res.status(400).json({
                erro: 'ID da solicitação inválido.'
            });
        }

        const { status } = req.body || {};

        if (!['AUTORIZADA', 'NEGADA'].includes(status)) {
            return res.status(400).json({
                erro: 'Resposta inválida. Utilize AUTORIZADA ou NEGADA.'
            });
        }

        const morador = await prisma.moradores.findFirst({
            where: {
                usuario_id: usuarioId,
                ativo: true,
                apartamentos: {
                    condominio_id: condominioId,
                    ativo: true
                }
            },
            select: {
                id: true,
                apartamento_id: true
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Cadastro de morador não encontrado ou inativo.'
            });
        }

        const solicitacaoExistente = await prisma.solicitacoes_acesso.findFirst({
            where: {
                id: solicitacaoId,
                condominio_id: condominioId,
                apartamento_destino_id: morador.apartamento_id
            },
            select: {
                id: true,
                status: true
            }
        });

        if (!solicitacaoExistente) {
            return res.status(404).json({
                erro: 'Solicitação não encontrada para seu apartamento.'
            });
        }

        if (solicitacaoExistente.status !== 'PENDENTE') {
            return res.status(409).json({
                erro: 'Esta solicitação já foi respondida e não pode ser alterada.'
            });
        }

        const dataHoraResposta = new Date();

        let codigoLiberacao = null;
        let atualizacao = null;

        // Na aprovação, gera código e tenta gravá-lo.
        // Se houver colisão no índice único, gera outro código.
        if (status === 'AUTORIZADA') {
            const codigoExpiraEm = calcularExpiracao(dataHoraResposta);

            for (let tentativa = 0; tentativa < 5; tentativa++) {
                const codigo = gerarCodigoLiberacao();
                const codigoHash = gerarHashCodigo(codigo);
                const codigoCriptografado = criptografarCodigo(codigo);

                try {
                    atualizacao = await prisma.solicitacoes_acesso.updateMany({
                        where: {
                            id: solicitacaoId,
                            condominio_id: condominioId,
                            apartamento_destino_id: morador.apartamento_id,
                            status: 'PENDENTE'
                        },
                        data: {
                            status,
                            respondido_por: usuarioId,
                            data_hora_resposta: dataHoraResposta,
                            codigo_liberacao_hash: codigoHash,
                            codigo_liberacao_criptografado: codigoCriptografado,
                            codigo_expira_em: codigoExpiraEm
                        }
                    });

                    if (atualizacao.count > 0) {
                        codigoLiberacao = codigo;
                    }

                    break;

                } catch (error) {
                    if (
                        error.code === 'P2002' &&
                        tentativa < 4
                    ) {
                        continue;
                    }

                    throw error;
                }
            }

        } else {
            atualizacao = await prisma.solicitacoes_acesso.updateMany({
                where: {
                    id: solicitacaoId,
                    condominio_id: condominioId,
                    apartamento_destino_id: morador.apartamento_id,
                    status: 'PENDENTE'
                },
                data: {
                    status,
                    respondido_por: usuarioId,
                    data_hora_resposta: dataHoraResposta
                }
            });
        }

        if (!atualizacao || atualizacao.count === 0) {
            return res.status(409).json({
                erro: 'Esta solicitação já foi respondida por outro morador.'
            });
        }

        const solicitacaoAtualizada = await prisma.solicitacoes_acesso.findUnique({
            where: {
                id: solicitacaoId
            },
            select: {
                id: true,
                nome: true,
                tipo_pessoa: true,
                status: true,
                respondido_por: true,
                data_hora_solicitacao: true,
                data_hora_resposta: true,
                codigo_expira_em: true,
                apartamentos: {
                    select: {
                        bloco: true,
                        numero: true
                    }
                }
            }
        });

        return res.status(200).json({
            mensagem: status === 'AUTORIZADA'
                ? 'Solicitação autorizada com sucesso. A autorização será válida por 24 horas.'
                : 'Solicitação recusada com sucesso.',
            solicitacao: {
                id: String(solicitacaoAtualizada.id),
                nome: solicitacaoAtualizada.nome,
                tipo_pessoa: solicitacaoAtualizada.tipo_pessoa,
                status: solicitacaoAtualizada.status,
                respondido_por: String(solicitacaoAtualizada.respondido_por),
                data_hora_solicitacao: solicitacaoAtualizada.data_hora_solicitacao,
                data_hora_resposta: solicitacaoAtualizada.data_hora_resposta,
                validade_horas: status === 'AUTORIZADA'
                    ? TEMPO_AUTORIZACAO_HORAS
                    : null,
                codigo_liberacao: codigoLiberacao,
                codigo_expira_em: codigoLiberacao
                    ? solicitacaoAtualizada.codigo_expira_em
                    : null,
                apartamento: solicitacaoAtualizada.apartamentos
                    ? {
                        bloco: solicitacaoAtualizada.apartamentos.bloco,
                        numero: solicitacaoAtualizada.apartamentos.numero
                    }
                    : null
            }
        });

    } catch (error) {
        console.error('ERRO AO RESPONDER SOLICITAÇÃO:', error);

        return res.status(500).json({
            erro: 'Erro ao responder solicitação de acesso.'
        });
    }
}

module.exports = {
    criarSolicitacaoPublica,
    criarConviteMorador,
    consultarSolicitacaoPublica,
    listarSolicitacoesMorador,
    responderSolicitacaoMorador
};
