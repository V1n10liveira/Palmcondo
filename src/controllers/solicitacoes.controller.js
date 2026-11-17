
const prisma = require('../lib/prisma');

const TEMPO_AUTORIZACAO_HORAS = 24;

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

// CRIAR SOLICITAÇÃO PÚBLICA DE ACESSO.
async function criarSolicitacaoPublica(req, res) {
    try {
        const {
            codigo_publico,
            nome,
            cpf,
            apartamento_destino_id,
            mensagem
        } = req.body || {};

        if (
            !codigo_publico ||
            !nome ||
            !cpf ||
            !apartamento_destino_id
        ) {
            return res.status(400).json({
                erro: 'Código do condomínio, nome, CPF e apartamento são obrigatórios.'
            });
        }

        const codigoLimpo = String(codigo_publico)
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
                        ativo: true
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

        const solicitacao = await prisma.solicitacoes_acesso.create({
            data: {
                condominio_id: condominio.id,
                nome: nomeLimpo,
                cpf: cpfLimpo,
                tipo_pessoa: 'VISITANTE',
                apartamento_destino_id: apartamento.id,
                mensagem: mensagemLimpa,
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

        return res.status(201).json({
            mensagem: 'Solicitação de acesso enviada com sucesso.',
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

        // Calcula o limite de 24 horas a partir da aprovação.
        const limiteExpiracao = new Date(
            Date.now() - TEMPO_AUTORIZACAO_HORAS * 60 * 60 * 1000
        );

        // Atualiza somente autorizações de visitantes vencidas.
        await prisma.solicitacoes_acesso.updateMany({
            where: {
                tipo_pessoa: 'VISITANTE',
                condominio_id: condominioId,
                apartamento_destino_id: morador.apartamento_id,
                status: 'AUTORIZADA',
                data_hora_resposta: {
                    lte: limiteExpiracao
                }
            },
            data: {
                status: 'EXPIRADA'
            }
        });

        // Retorna somente solicitações de visitantes do apartamento.
        const solicitacoes = await prisma.solicitacoes_acesso.findMany({
            where: {
                tipo_pessoa: 'VISITANTE',
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

        const atualizacao = await prisma.solicitacoes_acesso.updateMany({
            where: {
                id: solicitacaoId,
                condominio_id: condominioId,
                apartamento_destino_id: morador.apartamento_id,
                status: 'PENDENTE'
            },
            data: {
                status,
                respondido_por: usuarioId,
                data_hora_resposta: new Date()
            }
        });

        if (atualizacao.count === 0) {
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
    listarSolicitacoesMorador,
    responderSolicitacaoMorador
};
