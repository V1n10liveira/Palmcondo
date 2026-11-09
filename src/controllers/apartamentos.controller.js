
const prisma = require('../lib/prisma');

// Valida e converte IDs para BigInt
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

// Normaliza e valida os campos do apartamento
function validarDadosApartamento(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {
            erro: 'Dados do apartamento inválidos.'
        };
    }

    const {
        bloco,
        numero,
        andar,
        descricao
    } = body;

    if (
        numero === undefined ||
        numero === null ||
        !['string', 'number'].includes(typeof numero) ||
        String(numero).trim() === ''
    ) {
        return {
            erro: 'Número do apartamento é obrigatório.'
        };
    }

    const numeroNormalizado = String(numero).trim();

    if (numeroNormalizado.length > 20) {
        return {
            erro: 'O número do apartamento deve ter no máximo 20 caracteres.'
        };
    }

    function normalizarCampo(valor, nome, limite) {
        if (
            valor === undefined ||
            valor === null ||
            valor === ''
        ) {
            return {
                valor: null
            };
        }

        if (!['string', 'number'].includes(typeof valor)) {
            return {
                erro: `O campo ${nome} deve ser um texto válido.`
            };
        }

        const valorNormalizado = String(valor).trim();

        if (valorNormalizado === '') {
            return {
                valor: null
            };
        }

        if (valorNormalizado.length > limite) {
            return {
                erro: `O campo ${nome} deve ter no máximo ${limite} caracteres.`
            };
        }

        return {
            valor: valorNormalizado
        };
    }

    const blocoNormalizado = normalizarCampo(bloco, 'bloco', 50);

    if (blocoNormalizado.erro) {
        return {
            erro: blocoNormalizado.erro
        };
    }

    const andarNormalizado = normalizarCampo(andar, 'andar', 20);

    if (andarNormalizado.erro) {
        return {
            erro: andarNormalizado.erro
        };
    }

    const descricaoNormalizada = normalizarCampo(
        descricao,
        'descrição',
        150
    );

    if (descricaoNormalizada.erro) {
        return {
            erro: descricaoNormalizada.erro
        };
    }

    return {
        dados: {
            bloco: blocoNormalizado.valor,
            numero: numeroNormalizado,
            andar: andarNormalizado.valor,
            descricao: descricaoNormalizada.valor
        }
    };
}

// Formata o apartamento para as respostas da API
function formatarApartamento(apartamento) {
    return {
        id: String(apartamento.id),
        condominio_id: String(apartamento.condominio_id),
        bloco: apartamento.bloco,
        numero: apartamento.numero,
        andar: apartamento.andar,
        descricao: apartamento.descricao,
        ativo: apartamento.ativo,
        created_at: apartamento.created_at,
        updated_at: apartamento.updated_at
    };
}

// Verifica se o usuário possui um condomínio válido na sessão
function obterCondominioId(req) {
    return converterId(req.user?.condominio_id);
}

// Trata erros de duplicidade do Prisma
function ehErroDuplicidade(error) {
    return error.code === 'P2002';
}

// Lista os apartamentos ativos do condomínio
async function listarApartamentos(req, res) {
    try {
        const condominioId = obterCondominioId(req);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Condomínio do usuário inválido.'
            });
        }

        const apartamentos = await prisma.apartamentos.findMany({
            where: {
                condominio_id: condominioId,
                ativo: true
            },
            orderBy: [
                {
                    bloco: 'asc'
                },
                {
                    numero: 'asc'
                }
            ]
        });

        return res.json({
            total: apartamentos.length,
            apartamentos: apartamentos.map(formatarApartamento)
        });

    } catch (error) {
        console.error('ERRO AO LISTAR APARTAMENTOS:', error);

        return res.status(500).json({
            erro: 'Erro ao listar apartamentos.'
        });
    }
}

// Cadastra um novo apartamento
async function criarApartamento(req, res) {
    try {
        const condominioId = obterCondominioId(req);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Condomínio do usuário inválido.'
            });
        }

        const validacao = validarDadosApartamento(req.body);

        if (validacao.erro) {
            return res.status(400).json({
                erro: validacao.erro
            });
        }

        const dados = validacao.dados;

        // Verifica se já existe um apartamento com os mesmos dados,
        // independentemente de estar ativo ou inativo.
        const apartamentoExistente = await prisma.apartamentos.findFirst({
            where: {
                condominio_id: condominioId,
                bloco: dados.bloco,
                numero: dados.numero
            }
        });

        if (apartamentoExistente) {
            if (apartamentoExistente.ativo) {
                return res.status(409).json({
                    erro: 'Já existe um apartamento ativo com esse bloco e número.'
                });
            }

            return res.status(409).json({
                erro: 'Esse apartamento já está cadastrado, mas está inativo. Utilize a operação de reativação.'
            });
        }

        const apartamento = await prisma.apartamentos.create({
            data: {
                condominio_id: condominioId,
                ...dados
            }
        });

        return res.status(201).json({
            mensagem: 'Apartamento cadastrado com sucesso.',
            apartamento: formatarApartamento(apartamento)
        });

    } catch (error) {
        if (ehErroDuplicidade(error)) {
            return res.status(409).json({
                erro: 'Já existe um apartamento cadastrado com esses dados.'
            });
        }

        console.error('ERRO AO CADASTRAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao cadastrar apartamento.'
        });
    }
}

// Busca um apartamento específico
async function buscarApartamento(req, res) {
    try {
        const condominioId = obterCondominioId(req);
        const apartamentoId = converterId(req.params.id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Condomínio do usuário inválido.'
            });
        }

        if (!apartamentoId) {
            return res.status(400).json({
                erro: 'ID do apartamento inválido.'
            });
        }

        const apartamento = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: true
            }
        });

        if (!apartamento) {
            return res.status(404).json({
                erro: 'Apartamento não encontrado.'
            });
        }

        return res.json({
            apartamento: formatarApartamento(apartamento)
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao buscar apartamento.'
        });
    }
}

// Atualiza os dados de um apartamento ativo
async function atualizarApartamento(req, res) {
    try {
        const condominioId = obterCondominioId(req);
        const apartamentoId = converterId(req.params.id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Condomínio do usuário inválido.'
            });
        }

        if (!apartamentoId) {
            return res.status(400).json({
                erro: 'ID do apartamento inválido.'
            });
        }

        const validacao = validarDadosApartamento(req.body);

        if (validacao.erro) {
            return res.status(400).json({
                erro: validacao.erro
            });
        }

        const dados = validacao.dados;

        const apartamentoExistente = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: true
            }
        });

        if (!apartamentoExistente) {
            return res.status(404).json({
                erro: 'Apartamento não encontrado.'
            });
        }

        // Impede que outro apartamento do mesmo condomínio
        // tenha o mesmo bloco e número, mesmo se estiver inativo.
        const apartamentoDuplicado = await prisma.apartamentos.findFirst({
            where: {
                condominio_id: condominioId,
                bloco: dados.bloco,
                numero: dados.numero,
                id: {
                    not: apartamentoId
                }
            }
        });

        if (apartamentoDuplicado) {
            return res.status(409).json({
                erro: 'Já existe outro apartamento cadastrado com esse bloco e número.'
            });
        }

        // Atualiza somente se o apartamento ainda pertencer
        // ao condomínio e continuar ativo.
        const resultado = await prisma.apartamentos.updateMany({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: true
            },
            data: {
                ...dados,
                updated_at: new Date()
            }
        });

        if (resultado.count === 0) {
            return res.status(404).json({
                erro: 'Apartamento não encontrado ou não está mais ativo.'
            });
        }

        const apartamento = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: true
            }
        });

        return res.json({
            mensagem: 'Apartamento atualizado com sucesso.',
            apartamento: formatarApartamento(apartamento)
        });

    } catch (error) {
        if (ehErroDuplicidade(error)) {
            return res.status(409).json({
                erro: 'Já existe outro apartamento cadastrado com esses dados.'
            });
        }

        console.error('ERRO AO ATUALIZAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar apartamento.'
        });
    }
}

// Desativa um apartamento sem excluir seu registro
async function excluirApartamento(req, res) {
    try {
        const condominioId = obterCondominioId(req);
        const apartamentoId = converterId(req.params.id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Condomínio do usuário inválido.'
            });
        }

        if (!apartamentoId) {
            return res.status(400).json({
                erro: 'ID do apartamento inválido.'
            });
        }

        const resultado = await prisma.apartamentos.updateMany({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: true
            },
            data: {
                ativo: false,
                updated_at: new Date()
            }
        });

        if (resultado.count === 0) {
            return res.status(404).json({
                erro: 'Apartamento não encontrado.'
            });
        }

        const apartamento = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId
            }
        });

        return res.json({
            mensagem: 'Apartamento desativado com sucesso.',
            apartamento: formatarApartamento(apartamento)
        });

    } catch (error) {
        console.error('ERRO AO DESATIVAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao desativar apartamento.'
        });
    }
}

// Reativa um apartamento anteriormente desativado
async function reativarApartamento(req, res) {
    try {
        const condominioId = obterCondominioId(req);
        const apartamentoId = converterId(req.params.id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Condomínio do usuário inválido.'
            });
        }

        if (!apartamentoId) {
            return res.status(400).json({
                erro: 'ID do apartamento inválido.'
            });
        }

        // Somente MASTER e SINDICO podem reativar apartamentos.
        const perfisPermitidos = ['MASTER', 'SINDICO'];

        if (!perfisPermitidos.includes(req.user.tipo_usuario)) {
            return res.status(403).json({
                erro: 'Você não tem permissão para reativar apartamentos.'
            });
        }

        const apartamentoInativo = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: false
            }
        });

        if (!apartamentoInativo) {
            const apartamentoAtivo = await prisma.apartamentos.findFirst({
                where: {
                    id: apartamentoId,
                    condominio_id: condominioId,
                    ativo: true
                }
            });

            if (apartamentoAtivo) {
                return res.status(409).json({
                    erro: 'Esse apartamento já está ativo.'
                });
            }

            return res.status(404).json({
                erro: 'Apartamento não encontrado.'
            });
        }

        // Verifica se outro apartamento ativo utiliza o mesmo bloco e número.
        const apartamentoDuplicado = await prisma.apartamentos.findFirst({
            where: {
                condominio_id: condominioId,
                bloco: apartamentoInativo.bloco,
                numero: apartamentoInativo.numero,
                ativo: true,
                id: {
                    not: apartamentoId
                }
            }
        });

        if (apartamentoDuplicado) {
            return res.status(409).json({
                erro: 'Não é possível reativar este apartamento porque já existe outro apartamento ativo com o mesmo bloco e número.'
            });
        }

        // Reativa somente se o apartamento continuar inativo
        // e pertencer ao condomínio do usuário.
        const resultado = await prisma.apartamentos.updateMany({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: false
            },
            data: {
                ativo: true,
                updated_at: new Date()
            }
        });

        if (resultado.count === 0) {
            return res.status(409).json({
                erro: 'Não foi possível reativar o apartamento. Verifique se ele continua inativo.'
            });
        }

        const apartamento = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId,
                ativo: true
            }
        });

        return res.json({
            mensagem: 'Apartamento reativado com sucesso.',
            apartamento: formatarApartamento(apartamento)
        });

    } catch (error) {
        console.error('ERRO AO REATIVAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao reativar apartamento.'
        });
    }
}

// Exporta todas as funções utilizadas pelas rotas
module.exports = {
    listarApartamentos,
    criarApartamento,
    buscarApartamento,
    atualizarApartamento,
    excluirApartamento,
    reativarApartamento
};
