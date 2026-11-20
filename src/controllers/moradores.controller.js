
const bcrypt = require('bcryptjs');
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
// Ordenação: ativos primeiro e, dentro de cada situação,
// os cadastros atualizados mais recentemente primeiro.
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
            },
            orderBy: [
                {
                    ativo: 'desc'
                },
                {
                    updated_at: 'desc'
                },
                {
                    id: 'desc'
                }
            ]
        });

        const resultado = moradores.map(morador =>
            formatarMorador(morador, true)
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

// Cadastra um morador e sua conta de acesso em uma única transação
async function criarMorador(req, res) {
    try {
        const {
            nome,
            email,
            cpf,
            telefone,
            senha,
            apartamento_id,
            data_entrada
        } = req.body;

        if (
            !nome ||
            !email ||
            !cpf ||
            !senha ||
            !apartamento_id
        ) {
            return res.status(400).json({
                erro: 'Nome, e-mail, CPF, senha e apartamento são obrigatórios.'
            });
        }

        if (
            typeof nome !== 'string' ||
            typeof email !== 'string' ||
            typeof cpf !== 'string' ||
            typeof senha !== 'string'
        ) {
            return res.status(400).json({
                erro: 'Os dados informados possuem formato inválido.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                erro: 'A senha precisa ter pelo menos 8 caracteres.'
            });
        }

        const nomeFormatado = nome.trim();
        const emailFormatado = email.trim();
        const cpfFormatado = cpf.trim();

        if (!nomeFormatado || !emailFormatado || !cpfFormatado) {
            return res.status(400).json({
                erro: 'Nome, e-mail e CPF não podem ficar vazios.'
            });
        }

        const apartamentoId = converterId(apartamento_id);
        const condominioId = converterId(req.user.condominio_id);

        if (!apartamentoId || !condominioId) {
            return res.status(400).json({
                erro: 'ID do apartamento ou condomínio inválido.'
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

        const senhaHash = await bcrypt.hash(senha, 10);

        const morador = await prisma.$transaction(async (tx) => {

            const usuarioExistente = await tx.usuarios.findFirst({
                where: {
                    OR: [
                        { email: emailFormatado },
                        { cpf: cpfFormatado }
                    ]
                }
            });

            if (usuarioExistente) {
                if (usuarioExistente.email === emailFormatado) {
                    const erro = new Error(
                        'Já existe um usuário cadastrado com este e-mail.'
                    );
                    erro.code = 'EMAIL_DUPLICADO';
                    throw erro;
                }

                if (usuarioExistente.cpf === cpfFormatado) {
                    const erro = new Error(
                        'Já existe um usuário cadastrado com este CPF.'
                    );
                    erro.code = 'CPF_DUPLICADO';
                    throw erro;
                }
            }

            const apartamento = await tx.apartamentos.findFirst({
                where: {
                    id: apartamentoId,
                    condominio_id: condominioId
                }
            });

            if (!apartamento) {
                const erro = new Error(
                    'Apartamento não encontrado neste condomínio.'
                );
                erro.code = 'APARTAMENTO_NAO_ENCONTRADO';
                throw erro;
            }

            if (!apartamento.ativo) {
                const erro = new Error(
                    'O apartamento informado está inativo.'
                );
                erro.code = 'APARTAMENTO_INATIVO';
                throw erro;
            }

            const usuario = await tx.usuarios.create({
                data: {
                    condominio_id: condominioId,
                    nome: nomeFormatado,
                    email: emailFormatado,
                    senha_hash: senhaHash,
                    cpf: cpfFormatado,
                    telefone: telefone || null,
                    tipo_usuario: 'MORADOR',
                    ativo: true
                }
            });

            const novoMorador = await tx.moradores.create({
                data: {
                    usuario_id: usuario.id,
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

            return novoMorador;
        });

        return res.status(201).json({
            mensagem: 'Morador e conta de acesso cadastrados com sucesso.',
            morador: formatarMorador(morador)
        });

    } catch (error) {
        if (
            error.code === 'EMAIL_DUPLICADO' ||
            error.code === 'CPF_DUPLICADO'
        ) {
            return res.status(400).json({
                erro: error.message
            });
        }

        if (error.code === 'APARTAMENTO_NAO_ENCONTRADO') {
            return res.status(404).json({
                erro: error.message
            });
        }

        if (error.code === 'APARTAMENTO_INATIVO') {
            return res.status(400).json({
                erro: error.message
            });
        }

        if (error.code === 'P2002') {
            return res.status(400).json({
                erro: 'Já existe um cadastro com um dos dados informados.'
            });
        }

        console.error('ERRO AO CADASTRAR MORADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao cadastrar morador.'
        });
    }
}

// Atualiza os dados pessoais, apartamento e datas do morador
// O CPF é permanente e não pode ser alterado após o cadastro.
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
            nome,
            email,
            cpf,
            telefone,
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
            },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        cpf: true
                    }
                }
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Morador não encontrado.'
            });
        }

        // Impede qualquer alteração do CPF pela API.
        // Se o campo for enviado, deve ser exatamente igual ao cadastrado.
        if (cpf !== undefined) {
            if (
                typeof cpf !== 'string' ||
                cpf.trim() !== morador.usuarios.cpf
            ) {
                return res.status(400).json({
                    erro: 'O CPF não pode ser alterado após o cadastro.'
                });
            }
        }

        const dadosUsuario = {};
        const dadosAtualizacao = {};

        if (nome !== undefined) {
            if (typeof nome !== 'string' || !nome.trim()) {
                return res.status(400).json({
                    erro: 'O nome informado é inválido.'
                });
            }

            dadosUsuario.nome = nome.trim();
        }

        if (email !== undefined) {
            if (typeof email !== 'string' || !email.trim()) {
                return res.status(400).json({
                    erro: 'O e-mail informado é inválido.'
                });
            }

            dadosUsuario.email = email.trim();
        }

        if (telefone !== undefined) {
            if (
                telefone !== null &&
                typeof telefone !== 'string'
            ) {
                return res.status(400).json({
                    erro: 'O telefone informado é inválido.'
                });
            }

            dadosUsuario.telefone = telefone ? telefone.trim() : null;
        }

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

        if (
            Object.keys(dadosUsuario).length === 0 &&
            Object.keys(dadosAtualizacao).length === 0
        ) {
            return res.status(400).json({
                erro: 'Informe pelo menos um campo para atualizar.'
            });
        }

        // Atualiza a data do cadastro sempre que houver uma edição,
        // inclusive quando somente os dados da conta forem alterados.
        dadosAtualizacao.updated_at = new Date();

        const moradorAtualizado = await prisma.$transaction(async (tx) => {

            // Verifica se o novo e-mail já pertence a outro usuário.
            if (dadosUsuario.email !== undefined) {
                const usuarioExistente = await tx.usuarios.findFirst({
                    where: {
                        id: {
                            not: morador.usuario_id
                        },
                        email: dadosUsuario.email
                    }
                });

                if (usuarioExistente) {
                    const erro = new Error(
                        'Já existe um usuário cadastrado com este e-mail.'
                    );
                    erro.code = 'EMAIL_DUPLICADO';
                    throw erro;
                }
            }

            // Atualiza os dados da conta vinculada ao morador.
            if (Object.keys(dadosUsuario).length > 0) {
                const resultadoUsuario = await tx.usuarios.updateMany({
                    where: {
                        id: morador.usuario_id,
                        condominio_id: condominioId,
                        tipo_usuario: 'MORADOR'
                    },
                    data: dadosUsuario
                });

                if (resultadoUsuario.count !== 1) {
                    const erro = new Error(
                        'Conta do usuário não encontrada ou vínculo alterado.'
                    );
                    erro.code = 'USUARIO_UPDATE_CONFLICT';
                    throw erro;
                }
            }

            // Atualiza o cadastro do morador e sua data de atualização.
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
                const erro = new Error(
                    'Morador não encontrado ou vínculo alterado.'
                );
                erro.code = 'MORADOR_UPDATE_CONFLICT';
                throw erro;
            }

            // Sincroniza a situação da conta quando o status for alterado.
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
                    const erro = new Error(
                        'Conta do usuário não encontrada ou vínculo alterado.'
                    );
                    erro.code = 'USUARIO_UPDATE_CONFLICT';
                    throw erro;
                }
            }

            const apartamentoFinalId =
                dadosAtualizacao.apartamento_id !== undefined
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

            if (!registroAtualizado) {
                const erro = new Error(
                    'Não foi possível confirmar a atualização do morador.'
                );
                erro.code = 'MORADOR_UPDATE_CONFLICT';
                throw erro;
            }

            return registroAtualizado;
        });

        return res.json({
            mensagem: 'Morador atualizado com sucesso.',
            morador: formatarMorador(moradorAtualizado, true)
        });

    } catch (error) {
        if (error.code === 'EMAIL_DUPLICADO') {
            return res.status(400).json({
                erro: error.message
            });
        }

        if (
            error.code === 'MORADOR_UPDATE_CONFLICT' ||
            error.code === 'USUARIO_UPDATE_CONFLICT'
        ) {
            return res.status(409).json({
                erro: 'O morador não pôde ser atualizado. Verifique se o cadastro e o vínculo com o condomínio continuam válidos.'
            });
        }

        if (error.code === 'P2002') {
            return res.status(400).json({
                erro: 'Já existe um cadastro com um dos dados informados.'
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
                    data_saida: new Date(),
                    updated_at: new Date()
                }
            });

            if (resultadoMorador.count !== 1) {
                const erro = new Error(
                    'Morador não encontrado ou vínculo alterado.'
                );
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
                const erro = new Error(
                    'Conta do usuário não encontrada ou vínculo alterado.'
                );
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
                const erro = new Error(
                    'Não foi possível confirmar a desativação do morador.'
                );
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
