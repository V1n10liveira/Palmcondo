
const prisma = require('../lib/prisma');

// Valida e converte IDs positivos para BigInt
function converterId(valor) {
    if (
        valor === undefined ||
        valor === null ||
        !/^[1-9]\d*$/.test(String(valor))
    ) {
        return null;
    }

    return BigInt(valor);
}

// Valida datas, permitindo null ou string vazia quando aplicável
function converterData(valor) {
    if (valor === null || valor === '') {
        return { valida: true, data: null };
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return { valida: false };
    }

    return { valida: true, data };
}

// Formata os dados do morador.
// Dados pessoais são incluídos somente quando expressamente solicitado.
function formatarMorador(morador, incluirDadosPessoais = false) {
    return {
        id: String(morador.id),
        usuario_id: String(morador.usuarios.id),
        apartamento_id: String(morador.apartamentos.id),
        data_entrada: morador.data_entrada,
        data_saida: morador.data_saida,
        ativo: morador.ativo,
        created_at: morador.created_at,
        updated_at: morador.updated_at,
        usuario: {
            id: String(morador.usuarios.id),
            nome: morador.usuarios.nome,
            ...(incluirDadosPessoais && {
                email: morador.usuarios.email,
                cpf: morador.usuarios.cpf,
                telefone: morador.usuarios.telefone
            }),
            tipo_usuario: morador.usuarios.tipo_usuario,
            ativo: morador.usuarios.ativo
        },
        apartamento: {
            id: String(morador.apartamentos.id),
            bloco: morador.apartamentos.bloco,
            numero: morador.apartamentos.numero,
            andar: morador.apartamentos.andar,
            descricao: morador.apartamentos.descricao,
            ativo: morador.apartamentos.ativo
        }
    };
}

// Consulta os dados do próprio morador autenticado
async function consultarMeusDados(req, res) {
    try {
        const usuarioId = converterId(req.user.id);

        if (!usuarioId) {
            return res.status(400).json({
                erro: 'ID do usuário inválido.'
            });
        }

        const morador = await prisma.moradores.findFirst({
            where: {
                usuario_id: usuarioId,
                ativo: true,
                apartamentos: {
                    ativo: true
                }
            },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        cpf: true,
                        telefone: true,
                        tipo_usuario: true,
                        ativo: true
                    }
                },
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true,
                        andar: true,
                        descricao: true,
                        ativo: true
                    }
                }
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Cadastro de morador ativo não encontrado para este usuário.'
            });
        }

        return res.json({
            mensagem: 'Dados do morador autenticado.',
            morador: formatarMorador(morador, true)
        });

    } catch (error) {
        console.error('ERRO AO CONSULTAR DADOS DO MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao consultar seus dados.'
        });
    }
}

// Lista os moradores do condomínio
async function listarMoradores(req, res) {
    try {
        const condominioId = converterId(req.user.condominio_id);

        if (!condominioId) {
            return res.status(400).json({
                erro: 'ID do condomínio inválido.'
            });
        }

        const moradores = await prisma.moradores.findMany({
            where: {
                apartamentos: {
                    condominio_id: condominioId
                }
            },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        tipo_usuario: true,
                        ativo: true
                    }
                },
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true,
                        andar: true,
                        descricao: true,
                        ativo: true
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        const resultado = moradores.map(morador =>
            formatarMorador(morador)
        );

        return res.json({
            total: resultado.length,
            moradores: resultado
        });

    } catch (error) {
        console.error('ERRO AO LISTAR MORADORES:', error);

        return res.status(500).json({
            erro: 'Erro ao listar moradores.'
        });
    }
}

// Busca um morador pelo ID
async function buscarMorador(req, res) {
    try {
        const id = converterId(req.params.id);
        const condominioId = converterId(req.user.condominio_id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID do morador inválido.'
            });
        }

        if (!condominioId) {
            return res.status(400).json({
                erro: 'ID do condomínio inválido.'
            });
        }

        const morador = await prisma.moradores.findFirst({
            where: {
                id: id,
                apartamentos: {
                    condominio_id: condominioId
                }
            },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        tipo_usuario: true,
                        ativo: true
                    }
                },
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true,
                        andar: true,
                        descricao: true,
                        ativo: true
                    }
                }
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Morador não encontrado.'
            });
        }

        return res.json(formatarMorador(morador));

    } catch (error) {
        console.error('ERRO AO BUSCAR MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao buscar morador.'
        });
    }
}

// Cadastra um morador
async function criarMorador(req, res) {
    try {
        const {
            usuario_id,
            apartamento_id,
            data_entrada
        } = req.body;

        if (!usuario_id || !apartamento_id) {
            return res.status(400).json({
                erro: 'Usuário e apartamento são obrigatórios.'
            });
        }

        const usuarioId = converterId(usuario_id);
        const apartamentoId = converterId(apartamento_id);
        const condominioId = converterId(req.user.condominio_id);

        if (!usuarioId || !apartamentoId || !condominioId) {
            return res.status(400).json({
                erro: 'Um ou mais IDs informados são inválidos.'
            });
        }

        const dataEntrada = data_entrada === undefined
            ? { valida: true, data: null }
            : converterData(data_entrada);

        if (!dataEntrada.valida) {
            return res.status(400).json({
                erro: 'Data de entrada inválida.'
            });
        }

        const usuario = await prisma.usuarios.findFirst({
            where: {
                id: usuarioId,
                condominio_id: condominioId
            }
        });

        if (!usuario) {
            return res.status(404).json({
                erro: 'Usuário não encontrado neste condomínio.'
            });
        }

        if (usuario.tipo_usuario !== 'MORADOR') {
            return res.status(400).json({
                erro: 'O usuário informado não possui o tipo MORADOR.'
            });
        }

        if (!usuario.ativo) {
            return res.status(400).json({
                erro: 'O usuário informado está inativo.'
            });
        }

        const moradorExistente = await prisma.moradores.findUnique({
            where: {
                usuario_id: usuarioId
            }
        });

        if (moradorExistente) {
            return res.status(400).json({
                erro: 'Este usuário já está cadastrado como morador.'
            });
        }

        const apartamento = await prisma.apartamentos.findFirst({
            where: {
                id: apartamentoId,
                condominio_id: condominioId
            }
        });

        if (!apartamento) {
            return res.status(404).json({
                erro: 'Apartamento não encontrado neste condomínio.'
            });
        }

        if (!apartamento.ativo) {
            return res.status(400).json({
                erro: 'O apartamento informado está inativo.'
            });
        }

        const morador = await prisma.moradores.create({
            data: {
                usuario_id: usuarioId,
                apartamento_id: apartamentoId,
                data_entrada: dataEntrada.data
            },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        tipo_usuario: true,
                        ativo: true
                    }
                },
                apartamentos: {
                    select: {
                        id: true,
                        bloco: true,
                        numero: true,
                        andar: true,
                        descricao: true,
                        ativo: true
                    }
                }
            }
        });

        return res.status(201).json({
            mensagem: 'Morador cadastrado com sucesso.',
            morador: formatarMorador(morador)
        });

    } catch (error) {
        console.error('ERRO AO CADASTRAR MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao cadastrar morador.'
        });
    }
}

// Atualiza um morador e sincroniza o status da conta de usuário
async function atualizarMorador(req, res) {
    try {
        const id = converterId(req.params.id);
        const condominioId = converterId(req.user.condominio_id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID do morador inválido.'
            });
        }

        if (!condominioId) {
            return res.status(400).json({
                erro: 'ID do condomínio inválido.'
            });
        }

        const {
            apartamento_id,
            data_entrada,
            data_saida,
            ativo
        } = req.body;

        const morador = await prisma.moradores.findFirst({
            where: {
                id: id,
                apartamentos: {
                    condominio_id: condominioId
                }
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Morador não encontrado.'
            });
        }

        const dadosAtualizacao = {};

        if (apartamento_id !== undefined) {
            const apartamentoId = converterId(apartamento_id);

            if (!apartamentoId) {
                return res.status(400).json({
                    erro: 'ID do apartamento inválido.'
                });
            }

            const apartamento = await prisma.apartamentos.findFirst({
                where: {
                    id: apartamentoId,
                    condominio_id: condominioId
                }
            });

            if (!apartamento) {
                return res.status(404).json({
                    erro: 'Apartamento não encontrado neste condomínio.'
                });
            }

            if (!apartamento.ativo) {
                return res.status(400).json({
                    erro: 'O apartamento informado está inativo.'
                });
            }

            dadosAtualizacao.apartamento_id = apartamentoId;
        }

        if (data_entrada !== undefined) {
            const dataEntrada = converterData(data_entrada);

            if (!dataEntrada.valida) {
                return res.status(400).json({
                    erro: 'Data de entrada inválida.'
                });
            }

            dadosAtualizacao.data_entrada = dataEntrada.data;
        }

        if (data_saida !== undefined) {
            const dataSaida = converterData(data_saida);

            if (!dataSaida.valida) {
                return res.status(400).json({
                    erro: 'Data de saída inválida.'
                });
            }

            dadosAtualizacao.data_saida = dataSaida.data;
        }

        if (ativo !== undefined) {
            if (typeof ativo !== 'boolean') {
                return res.status(400).json({
                    erro: 'O campo ativo deve ser true ou false.'
                });
            }

            dadosAtualizacao.ativo = ativo;
        }

        if (Object.keys(dadosAtualizacao).length === 0) {
            return res.status(400).json({
                erro: 'Informe pelo menos um campo para atualizar.'
            });
        }

        // Atualiza o morador e, quando necessário, sua conta
        // dentro de uma única transação.
        const moradorAtualizado = await prisma.$transaction(async (tx) => {

            const resultadoAtualizacao = await tx.moradores.updateMany({
                where: {
                    id: id,
                    usuario_id: morador.usuario_id,
                    apartamento_id: morador.apartamento_id,
                    apartamentos: {
                        condominio_id: condominioId
                    }
                },
                data: dadosAtualizacao
            });

            if (resultadoAtualizacao.count !== 1) {
                const erro = new Error('Morador não encontrado ou vínculo alterado.');
                erro.code = 'MORADOR_UPDATE_CONFLICT';
                throw erro;
            }

            // Sincroniza a conta somente quando o campo ativo foi informado.
            if (ativo !== undefined) {
                const resultadoUsuario = await tx.usuarios.updateMany({
                    where: {
                        id: morador.usuario_id,
                        condominio_id: condominioId,
                        tipo_usuario: 'MORADOR'
                    },
                    data: {
                        ativo: ativo
                    }
                });

                if (resultadoUsuario.count !== 1) {
                    const erro = new Error('Conta do usuário não encontrada ou vínculo alterado.');
                    erro.code = 'USUARIO_UPDATE_CONFLICT';
                    throw erro;
                }
            }

            const apartamentoFinalId = dadosAtualizacao.apartamento_id !== undefined
                ? dadosAtualizacao.apartamento_id
                : morador.apartamento_id;

            const registroAtualizado = await tx.moradores.findFirst({
                where: {
                    id: id,
                    usuario_id: morador.usuario_id,
                    apartamento_id: apartamentoFinalId,
                    apartamentos: {
                        condominio_id: condominioId
                    }
                },
                include: {
                    usuarios: {
                        select: {
                            id: true,
                            nome: true,
                            tipo_usuario: true,
                            ativo: true
                        }
                    },
                    apartamentos: {
                        select: {
                            id: true,
                            bloco: true,
                            numero: true,
                            andar: true,
                            descricao: true,
                            ativo: true
                        }
                    }
                }
            });

            if (!registroAtualizado) {
                const erro = new Error('Não foi possível confirmar a atualização do morador.');
                erro.code = 'MORADOR_UPDATE_CONFLICT';
                throw erro;
            }

            return registroAtualizado;
        });

        return res.json({
            mensagem: 'Morador atualizado com sucesso.',
            morador: formatarMorador(moradorAtualizado)
        });

    } catch (error) {
        if (
            error.code === 'MORADOR_UPDATE_CONFLICT' ||
            error.code === 'USUARIO_UPDATE_CONFLICT'
        ) {
            return res.status(409).json({
                erro: 'O morador não pôde ser atualizado. Verifique se o cadastro e o vínculo com o condomínio continuam válidos.'
            });
        }

        console.error('ERRO AO ATUALIZAR MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar morador.'
        });
    }
}

// Desativa o morador e sua conta de usuário
async function excluirMorador(req, res) {
    try {
        const id = converterId(req.params.id);
        const condominioId = converterId(req.user.condominio_id);

        if (!id) {
            return res.status(400).json({
                erro: 'ID do morador inválido.'
            });
        }

        if (!condominioId) {
            return res.status(400).json({
                erro: 'ID do condomínio inválido.'
            });
        }

        const morador = await prisma.moradores.findFirst({
            where: {
                id: id,
                apartamentos: {
                    condominio_id: condominioId
                }
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Morador não encontrado.'
            });
        }

        // Executa as duas desativações em uma única transação.
        // Qualquer divergência provoca rollback das duas operações.
        const moradorAtualizado = await prisma.$transaction(async (tx) => {

            const resultadoMorador = await tx.moradores.updateMany({
                where: {
                    id: id,
                    usuario_id: morador.usuario_id,
                    apartamento_id: morador.apartamento_id,
                    apartamentos: {
                        condominio_id: condominioId
                    }
                },
                data: {
                    ativo: false,
                    data_saida: new Date()
                }
            });

            if (resultadoMorador.count !== 1) {
                const erro = new Error('Morador não encontrado ou vínculo alterado.');
                erro.code = 'MORADOR_UPDATE_CONFLICT';
                throw erro;
            }

            const resultadoUsuario = await tx.usuarios.updateMany({
                where: {
                    id: morador.usuario_id,
                    condominio_id: condominioId,
                    tipo_usuario: 'MORADOR'
                },
                data: {
                    ativo: false
                }
            });

            if (resultadoUsuario.count !== 1) {
                const erro = new Error('Conta do usuário não encontrada ou vínculo alterado.');
                erro.code = 'USUARIO_UPDATE_CONFLICT';
                throw erro;
            }

            const registroAtualizado = await tx.moradores.findFirst({
                where: {
                    id: id,
                    usuario_id: morador.usuario_id,
                    apartamento_id: morador.apartamento_id,
                    apartamentos: {
                        condominio_id: condominioId
                    }
                }
            });

            if (!registroAtualizado) {
                const erro = new Error('Não foi possível confirmar a desativação do morador.');
                erro.code = 'MORADOR_UPDATE_CONFLICT';
                throw erro;
            }

            return registroAtualizado;
        });

        return res.json({
            mensagem: 'Morador e conta de usuário desativados com sucesso.',
            morador: {
                id: String(moradorAtualizado.id),
                usuario_id: String(moradorAtualizado.usuario_id),
                apartamento_id: String(moradorAtualizado.apartamento_id),
                ativo: moradorAtualizado.ativo,
                data_saida: moradorAtualizado.data_saida
            }
        });

    } catch (error) {
        if (
            error.code === 'MORADOR_UPDATE_CONFLICT' ||
            error.code === 'USUARIO_UPDATE_CONFLICT'
        ) {
            return res.status(409).json({
                erro: 'O morador não pôde ser desativado. Verifique se o cadastro e o vínculo com o condomínio continuam válidos.'
            });
        }

        console.error('ERRO AO DESATIVAR MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao desativar morador.'
        });
    }
}

module.exports = {
    consultarMeusDados,
    listarMoradores,
    buscarMorador,
    criarMorador,
    atualizarMorador,
    excluirMorador
};
