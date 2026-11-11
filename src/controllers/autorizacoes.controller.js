const prisma = require('../lib/prisma');

const TIPOS_PESSOA = ['VISITANTE', 'PRESTADOR'];
const PERFIS_AUTORIZACAO = ['MORADOR', 'SINDICO'];

// Converte IDs positivos para BigInt sem permitir valores inválidos.
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

// Valida datas no formato YYYY-MM-DD.
// Também aceita Date, pois o Prisma retorna datas nesse formato.
function validarData(data) {
    if (data instanceof Date) {
        return Number.isNaN(data.getTime()) ? null : data;
    }

    if (typeof data !== 'string') {
        return null;
    }

    const formatoValido = /^\d{4}-\d{2}-\d{2}$/.test(data);

    if (!formatoValido) {
        return null;
    }

    const resultado = new Date(`${data}T00:00:00.000Z`);

    if (
        Number.isNaN(resultado.getTime()) ||
        resultado.toISOString().slice(0, 10) !== data
    ) {
        return null;
    }

    return resultado;
}

function validarHora(hora) {
    return typeof hora === 'string' &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

function formatarPessoa(pessoa) {
    if (!pessoa) return null;

    return {
        id: String(pessoa.id),
        nome: pessoa.nome,
        cpf: pessoa.cpf,
        telefone: pessoa.telefone,
        tipo_pessoa: pessoa.tipo_pessoa,
        observacao: pessoa.observacao,
        ativo: pessoa.ativo
    };
}

function formatarAutorizacao(autorizacao) {
    if (!autorizacao) return null;

    const apartamento = autorizacao.moradores?.apartamentos;

    return {
        ...autorizacao,
        id: String(autorizacao.id),
        condominio_id: String(autorizacao.condominio_id),
        morador_id: autorizacao.morador_id
            ? String(autorizacao.morador_id)
            : null,
        pessoa_id: String(autorizacao.pessoa_id),
        criado_por: String(autorizacao.criado_por),

        pessoa: formatarPessoa(autorizacao.pessoas),

        morador: autorizacao.moradores
            ? {
                id: String(autorizacao.moradores.id),
                usuario_id: String(autorizacao.moradores.usuario_id),
                nome: autorizacao.moradores.usuarios.nome,
                apartamento: apartamento
                    ? {
                        id: String(apartamento.id),
                        condominio_id: String(apartamento.condominio_id),
                        bloco: apartamento.bloco,
                        numero: apartamento.numero,
                        andar: apartamento.andar,
                        descricao: apartamento.descricao,
                        ativo: apartamento.ativo
                    }
                    : null
            }
            : null,

        criado_por_usuario: autorizacao.usuarios
            ? {
                id: String(autorizacao.usuarios.id),
                nome: autorizacao.usuarios.nome
            }
            : null,

        pessoas: undefined,
        moradores: undefined,
        usuarios: undefined
    };
}

function obterDadosRelacionados() {
    return {
        pessoas: true,
        moradores: {
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                apartamentos: {
                    select: {
                        id: true,
                        condominio_id: true,
                        bloco: true,
                        numero: true,
                        andar: true,
                        descricao: true,
                        ativo: true
                    }
                }
            }
        },
        usuarios: {
            select: {
                id: true,
                nome: true
            }
        }
    };
}

async function obterMoradorResponsavel(tx, req, moradorIdInformado) {
    const condominioId = converterId(req.user.condominio_id);
    const usuarioId = converterId(req.user.id);
    const perfil = req.user.tipo_usuario;

    if (!condominioId || !usuarioId) {
        throw new Error('PERFIL_SEM_PERMISSAO');
    }

    if (perfil === 'MORADOR') {
        const morador = await tx.moradores.findFirst({
            where: {
                usuario_id: usuarioId,
                ativo: true,
                apartamentos: {
                    condominio_id: condominioId,
                    ativo: true
                }
            }
        });

        if (!morador) {
            throw new Error('MORADOR_NAO_ENCONTRADO');
        }

        return morador.id;
    }

    if (perfil === 'SINDICO') {
        const id = converterId(moradorIdInformado);

        if (!id) {
            throw new Error('MORADOR_OBRIGATORIO');
        }

        const morador = await tx.moradores.findFirst({
            where: {
                id,
                ativo: true,
                apartamentos: {
                    condominio_id: condominioId,
                    ativo: true
                }
            }
        });

        if (!morador) {
            throw new Error('MORADOR_INVALIDO');
        }

        return morador.id;
    }

    throw new Error('PERFIL_SEM_PERMISSAO');
}

// LISTAR AUTORIZAÇÕES
async function listarAutorizacoes(req, res) {
    try {
        const condominioId = converterId(req.user.condominio_id);
        const usuarioId = converterId(req.user.id);
        const perfil = req.user.tipo_usuario;

        if (!PERFIS_AUTORIZACAO.includes(perfil)) {
            return res.status(403).json({
                erro: 'Você não tem permissão para consultar autorizações.'
            });
        }

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const where = {
            condominio_id: condominioId
        };

        if (perfil === 'MORADOR') {
            const morador = await prisma.moradores.findFirst({
                where: {
                    usuario_id: usuarioId,
                    ativo: true,
                    apartamentos: {
                        condominio_id: condominioId,
                        ativo: true
                    }
                }
            });

            if (!morador) {
                return res.status(404).json({
                    erro: 'Cadastro de morador não encontrado.'
                });
            }

            where.morador_id = morador.id;
        }

        const autorizacoes = await prisma.autorizacoes.findMany({
            where,
            include: obterDadosRelacionados(),
            orderBy: {
                created_at: 'desc'
            }
        });

        return res.status(200).json({
            total: autorizacoes.length,
            autorizacoes: autorizacoes.map(formatarAutorizacao)
        });

    } catch (error) {
        console.error('ERRO AO LISTAR AUTORIZAÇÕES:', error);

        return res.status(500).json({
            erro: 'Erro ao listar autorizações.'
        });
    }
}

// BUSCAR AUTORIZAÇÃO POR ID
async function buscarAutorizacao(req, res) {
    try {
        const condominioId = converterId(req.user.condominio_id);
        const usuarioId = converterId(req.user.id);
        const perfil = req.user.tipo_usuario;

        if (!PERFIS_AUTORIZACAO.includes(perfil)) {
            return res.status(403).json({
                erro: 'Você não tem permissão para consultar autorizações.'
            });
        }

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const id = converterId(req.params.id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID da autorização inválido.'
            });
        }

        const where = {
            id,
            condominio_id: condominioId
        };

        if (perfil === 'MORADOR') {
            const morador = await prisma.moradores.findFirst({
                where: {
                    usuario_id: usuarioId,
                    ativo: true,
                    apartamentos: {
                        condominio_id: condominioId,
                        ativo: true
                    }
                }
            });

            if (!morador) {
                return res.status(404).json({
                    erro: 'Cadastro de morador não encontrado.'
                });
            }

            where.morador_id = morador.id;
        }

        const autorizacao = await prisma.autorizacoes.findFirst({
            where,
            include: obterDadosRelacionados()
        });

        if (!autorizacao) {
            return res.status(404).json({
                erro: 'Autorização não encontrada.'
            });
        }

        return res.status(200).json({
            autorizacao: formatarAutorizacao(autorizacao)
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR AUTORIZAÇÃO:', error);

        return res.status(500).json({
            erro: 'Erro ao buscar autorização.'
        });
    }
}

// CRIAR AUTORIZAÇÃO
async function criarAutorizacao(req, res) {
    try {
        const condominioId = converterId(req.user.condominio_id);
        const usuarioId = converterId(req.user.id);
        const perfil = req.user.tipo_usuario;

        if (perfil !== 'MORADOR') {
            return res.status(403).json({
                erro: 'Apenas moradores podem criar autorizações particulares.'
            });
        }

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const {
            nome,
            cpf,
            telefone,
            tipo_pessoa,
            empresa,
            servico,
            morador_id,
            data_inicio,
            data_fim,
            hora_inicio,
            hora_fim,
            motivo,
            observacao
        } = req.body;

        if (
            !nome ||
            !cpf ||
            !tipo_pessoa ||
            !data_inicio ||
            !data_fim ||
            !hora_inicio ||
            !hora_fim
        ) {
            return res.status(400).json({
                erro: 'Nome, CPF, tipo de pessoa, período e horários são obrigatórios.'
            });
        }

        if (!TIPOS_PESSOA.includes(tipo_pessoa)) {
            return res.status(400).json({
                erro: 'Tipo de pessoa inválido. Utilize VISITANTE ou PRESTADOR.'
            });
        }

        const cpfLimpo = String(cpf).replace(/\D/g, '');

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                erro: 'O CPF deve conter 11 números.'
            });
        }

        if (tipo_pessoa === 'PRESTADOR' && (!empresa || !servico)) {
            return res.status(400).json({
                erro: 'Empresa e serviço são obrigatórios para prestadores.'
            });
        }

        const inicio = validarData(data_inicio);
        const fim = validarData(data_fim);

        if (!inicio || !fim) {
            return res.status(400).json({
                erro: 'Data de início ou término inválida. Utilize o formato YYYY-MM-DD.'
            });
        }

        if (fim < inicio) {
            return res.status(400).json({
                erro: 'A data de término não pode ser anterior à data de início.'
            });
        }

        if (!validarHora(hora_inicio) || !validarHora(hora_fim)) {
            return res.status(400).json({
                erro: 'Horários inválidos. Utilize o formato HH:mm.'
            });
        }

        if (
            inicio.getTime() === fim.getTime() &&
            hora_fim <= hora_inicio
        ) {
            return res.status(400).json({
                erro: 'O horário de término deve ser posterior ao horário de início.'
            });
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const moradorId = await obterMoradorResponsavel(
                tx,
                req,
                morador_id
            );

            const pessoaExistente = await tx.pessoas.findUnique({
                where: {
                    condominio_id_cpf: {
                        condominio_id: condominioId,
                        cpf: cpfLimpo
                    }
                }
            });

            let pessoa;

            if (pessoaExistente) {
                if (!pessoaExistente.ativo) {
                    throw new Error('PESSOA_INATIVA');
                }

                if (pessoaExistente.tipo_pessoa !== tipo_pessoa) {
                    throw new Error('TIPO_PESSOA_DIFERENTE');
                }

                pessoa = pessoaExistente;
            } else {
                pessoa = await tx.pessoas.create({
                    data: {
                        condominio_id: condominioId,
                        nome,
                        cpf: cpfLimpo,
                        telefone: telefone || null,
                        tipo_pessoa,
                        observacao: observacao || null,
                        ativo: true
                    }
                });
            }

            if (tipo_pessoa === 'PRESTADOR') {
                const prestadorExistente = await tx.prestadores.findUnique({
                    where: {
                        pessoa_id: pessoa.id
                    }
                });

                if (!prestadorExistente) {
                    await tx.prestadores.create({
                        data: {
                            pessoa_id: pessoa.id,
                            empresa,
                            servico,
                            observacao: observacao || null,
                            ativo: true
                        }
                    });
                } else if (!prestadorExistente.ativo) {
                    throw new Error('PRESTADOR_INATIVO');
                }
            }

            const autorizacao = await tx.autorizacoes.create({
                data: {
                    condominio_id: condominioId,
                    morador_id: moradorId,
                    pessoa_id: pessoa.id,
                    data_inicio: inicio,
                    data_fim: fim,
                    hora_inicio,
                    hora_fim,
                    motivo: motivo || null,
                    observacao: observacao || null,
                    status: 'ATIVA',
                    criado_por: usuarioId
                },
                include: obterDadosRelacionados()
            });

            return autorizacao;
        });

        return res.status(201).json({
            mensagem: 'Autorização criada com sucesso.',
            autorizacao: formatarAutorizacao(resultado)
        });

    } catch (error) {
        console.error('ERRO AO CRIAR AUTORIZAÇÃO:', error);

        const erros = {
            MORADOR_NAO_ENCONTRADO: [404, 'Cadastro de morador não encontrado ou inativo.'],
            MORADOR_OBRIGATORIO: [400, 'O síndico deve informar o morador responsável.'],
            MORADOR_INVALIDO: [400, 'Morador informado não encontrado, inativo ou não pertence ao condomínio.'],
            PERFIL_SEM_PERMISSAO: [403, 'Perfil sem permissão para criar autorizações.'],
            PESSOA_INATIVA: [400, 'Já existe uma pessoa com este CPF, mas ela está inativa.'],
            TIPO_PESSOA_DIFERENTE: [409, 'Este CPF já está cadastrado com outro tipo de pessoa.'],
            PRESTADOR_INATIVO: [400, 'O cadastro de prestador vinculado a este CPF está inativo.']
        };

        if (erros[error.message]) {
            return res.status(erros[error.message][0]).json({
                erro: erros[error.message][1]
            });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({
                erro: 'Já existe um cadastro com os dados informados.'
            });
        }

        return res.status(500).json({
            erro: 'Erro ao criar autorização.'
        });
    }
}

// ATUALIZAR AUTORIZAÇÃO
async function atualizarAutorizacao(req, res) {
    try {
        const condominioId = converterId(req.user.condominio_id);
        const usuarioId = converterId(req.user.id);
        const perfil = req.user.tipo_usuario;

        if (perfil !== 'MORADOR') {
            return res.status(403).json({
                erro: 'Apenas moradores podem atualizar suas próprias autorizações.'
            });
        }

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const id = converterId(req.params.id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID da autorização inválido.'
            });
        }

        const where = {
            id,
            condominio_id: condominioId
        };

        if (perfil === 'MORADOR') {
            const morador = await prisma.moradores.findFirst({
                where: {
                    usuario_id: usuarioId,
                    ativo: true,
                    apartamentos: {
                        condominio_id: condominioId,
                        ativo: true
                    }
                }
            });

            if (!morador) {
                return res.status(404).json({
                    erro: 'Cadastro de morador não encontrado.'
                });
            }

            where.morador_id = morador.id;
        }

        const existente = await prisma.autorizacoes.findFirst({
            where
        });

        if (!existente) {
            return res.status(404).json({
                erro: 'Autorização não encontrada.'
            });
        }

        if (existente.status === 'CANCELADA') {
            return res.status(400).json({
                erro: 'Não é possível atualizar uma autorização cancelada.'
            });
        }

        if (existente.status === 'UTILIZADA') {
            return res.status(400).json({
                erro: 'Não é possível atualizar uma autorização utilizada.'
            });
        }

        const {
            data_inicio,
            data_fim,
            hora_inicio,
            hora_fim,
            morador_id,
            motivo,
            observacao
        } = req.body;

        const inicio = data_inicio !== undefined
            ? validarData(data_inicio)
            : existente.data_inicio;

        const fim = data_fim !== undefined
            ? validarData(data_fim)
            : existente.data_fim;

        const horaInicio = hora_inicio !== undefined
            ? hora_inicio
            : existente.hora_inicio;

        const horaFim = hora_fim !== undefined
            ? hora_fim
            : existente.hora_fim;

        if (!inicio || !fim || fim < inicio) {
            return res.status(400).json({
                erro: 'Informe um período válido para a autorização.'
            });
        }

        if (!validarHora(horaInicio) || !validarHora(horaFim)) {
            return res.status(400).json({
                erro: 'Horários inválidos. Utilize o formato HH:mm.'
            });
        }

        if (
            inicio.getTime() === fim.getTime() &&
            horaFim <= horaInicio
        ) {
            return res.status(400).json({
                erro: 'O horário de término deve ser posterior ao horário de início.'
            });
        }

        const dadosAtualizacao = {
            data_inicio: inicio,
            data_fim: fim,
            hora_inicio: horaInicio,
            hora_fim: horaFim
        };

        if (motivo !== undefined) {
            dadosAtualizacao.motivo = motivo || null;
        }

        if (observacao !== undefined) {
            dadosAtualizacao.observacao = observacao || null;
        }

        if (perfil === 'SINDICO' && morador_id !== undefined) {
            const moradorId = converterId(morador_id);

            if (!moradorId) {
                return res.status(400).json({
                    erro: 'ID do morador inválido.'
                });
            }

            const morador = await prisma.moradores.findFirst({
                where: {
                    id: moradorId,
                    ativo: true,
                    apartamentos: {
                        condominio_id: condominioId,
                        ativo: true
                    }
                }
            });

            if (!morador) {
                return res.status(400).json({
                    erro: 'Morador informado não encontrado ou inativo.'
                });
            }

            dadosAtualizacao.morador_id = morador.id;
        }

        const atualizada = await prisma.autorizacoes.update({
            where: {
                id
            },
            data: dadosAtualizacao,
            include: obterDadosRelacionados()
        });

        return res.status(200).json({
            mensagem: 'Autorização atualizada com sucesso.',
            autorizacao: formatarAutorizacao(atualizada)
        });

    } catch (error) {
        console.error('ERRO AO ATUALIZAR AUTORIZAÇÃO:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar autorização.'
        });
    }
}

// CANCELAR AUTORIZAÇÃO (EXCLUSÃO LÓGICA)
async function excluirAutorizacao(req, res) {
    try {
        const condominioId = converterId(req.user.condominio_id);
        const usuarioId = converterId(req.user.id);
        const perfil = req.user.tipo_usuario;

        if (perfil !== 'MORADOR') {
            return res.status(403).json({
                erro: 'Apenas moradores podem cancelar suas próprias autorizações.'
            });
        }

        if (!condominioId || !usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const id = converterId(req.params.id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID da autorização inválido.'
            });
        }

        const where = {
            id,
            condominio_id: condominioId
        };

        if (perfil === 'MORADOR') {
            const morador = await prisma.moradores.findFirst({
                where: {
                    usuario_id: usuarioId,
                    ativo: true,
                    apartamentos: {
                        condominio_id: condominioId,
                        ativo: true
                    }
                }
            });

            if (!morador) {
                return res.status(404).json({
                    erro: 'Cadastro de morador não encontrado.'
                });
            }

            where.morador_id = morador.id;
        }

        const autorizacao = await prisma.autorizacoes.findFirst({
            where
        });

        if (!autorizacao) {
            return res.status(404).json({
                erro: 'Autorização não encontrada.'
            });
        }

        if (autorizacao.status === 'CANCELADA') {
            return res.status(400).json({
                erro: 'Esta autorização já está cancelada.'
            });
        }

        if (autorizacao.status === 'UTILIZADA') {
            return res.status(400).json({
                erro: 'Não é possível cancelar uma autorização já utilizada.'
            });
        }

        const cancelada = await prisma.autorizacoes.update({
            where: {
                id
            },
            data: {
                status: 'CANCELADA'
            },
            include: obterDadosRelacionados()
        });

        return res.status(200).json({
            mensagem: 'Autorização cancelada com sucesso.',
            autorizacao: formatarAutorizacao(cancelada)
        });

    } catch (error) {
        console.error('ERRO AO CANCELAR AUTORIZAÇÃO:', error);

        return res.status(500).json({
            erro: 'Erro ao cancelar autorização.'
        });
    }
}

module.exports = {
    listarAutorizacoes,
    buscarAutorizacao,
    criarAutorizacao,
    atualizarAutorizacao,
    excluirAutorizacao
};