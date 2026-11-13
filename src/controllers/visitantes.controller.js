
const prisma = require('../lib/prisma');

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

// Formata os dados para evitar problemas com BigInt no JSON.
function formatarVisitante(vinculo) {
    if (!vinculo) return null;

    const pessoa = vinculo.pessoas;

    return {
        vinculo_id: String(vinculo.id),
        pessoa_id: pessoa ? String(pessoa.id) : null,
        nome: pessoa?.nome || null,
        cpf: pessoa?.cpf || null,
        telefone: pessoa?.telefone || null,
        observacao: pessoa?.observacao || null,
        ativo: vinculo.ativo,
        created_at: vinculo.created_at,
        updated_at: vinculo.updated_at
    };
}

// Verifica se o usuário possui perfil de MORADOR.
function validarPermissao(req, res) {
    if (req.user.tipo_usuario !== 'MORADOR') {
        res.status(403).json({
            erro: 'Somente moradores podem gerenciar seus visitantes.'
        });

        return false;
    }

    return true;
}

// Localiza o morador autenticado e valida seu vínculo com o condomínio.
async function obterMoradorAutenticado(req) {
    const usuarioId = converterId(req.user.id);
    const condominioId = converterId(req.user.condominio_id);

    if (!usuarioId || !condominioId) {
        return null;
    }

    return prisma.moradores.findFirst({
        where: {
            usuario_id: usuarioId,
            ativo: true,
            apartamentos: {
                is: {
                    ativo: true,
                    condominio_id: condominioId
                }
            }
        }
    });
}

// LISTAR VISITANTES VINCULADOS AO MORADOR AUTENTICADO.
async function listarVisitantes(req, res) {
    try {
        if (!validarPermissao(req, res)) return;

        const condominioId = converterId(req.user.condominio_id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const morador = await obterMoradorAutenticado(req);

        if (!morador) {
            return res.status(403).json({
                erro: 'Morador não encontrado, inativo ou sem apartamento ativo no condomínio.'
            });
        }

        const vinculos = await prisma.moradores_visitantes.findMany({
            where: {
                morador_id: morador.id,
                ativo: true,
                pessoas: {
                    is: {
                        condominio_id: condominioId,
                        tipo_pessoa: 'VISITANTE',
                        ativo: true
                    }
                }
            },
            include: {
                pessoas: true
            }
        });

        vinculos.sort((a, b) =>
            a.pessoas.nome.localeCompare(b.pessoas.nome)
        );

        return res.status(200).json({
            total: vinculos.length,
            visitantes: vinculos.map(formatarVisitante)
        });

    } catch (error) {
        console.error('ERRO AO LISTAR VISITANTES:', error);

        return res.status(500).json({
            erro: 'Erro ao listar visitantes.'
        });
    }
}

// BUSCAR VISITANTE PELO ID DO VÍNCULO.
async function buscarVisitante(req, res) {
    try {
        if (!validarPermissao(req, res)) return;

        const condominioId = converterId(req.user.condominio_id);
        const id = converterId(req.params.id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (!id) {
            return res.status(400).json({
                erro: 'ID do vínculo inválido.'
            });
        }

        const morador = await obterMoradorAutenticado(req);

        if (!morador) {
            return res.status(403).json({
                erro: 'Morador não encontrado, inativo ou sem apartamento ativo no condomínio.'
            });
        }

        const vinculo = await prisma.moradores_visitantes.findFirst({
            where: {
                id,
                morador_id: morador.id,
                ativo: true,
                pessoas: {
                    is: {
                        condominio_id: condominioId,
                        tipo_pessoa: 'VISITANTE',
                        ativo: true
                    }
                }
            },
            include: {
                pessoas: true
            }
        });

        if (!vinculo) {
            return res.status(404).json({
                erro: 'Visitante não encontrado.'
            });
        }

        return res.status(200).json({
            visitante: formatarVisitante(vinculo)
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR VISITANTE:', error);

        return res.status(500).json({
            erro: 'Erro ao buscar visitante.'
        });
    }
}

// CADASTRAR OU REUTILIZAR VISITANTE.
async function criarVisitante(req, res) {
    try {
        if (!validarPermissao(req, res)) return;

        const condominioId = converterId(req.user.condominio_id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const morador = await obterMoradorAutenticado(req);

        if (!morador) {
            return res.status(403).json({
                erro: 'Morador não encontrado, inativo ou sem apartamento ativo no condomínio.'
            });
        }

        const {
            nome,
            cpf,
            telefone,
            observacao
        } = req.body;

        if (!nome || !cpf) {
            return res.status(400).json({
                erro: 'Nome e CPF são obrigatórios.'
            });
        }

        const nomeLimpo = String(nome).trim();
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const telefoneLimpo = telefone
            ? String(telefone).trim()
            : null;
        const observacaoLimpa = observacao
            ? String(observacao).trim()
            : null;

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

        if (telefoneLimpo && telefoneLimpo.length > 20) {
            return res.status(400).json({
                erro: 'O telefone deve possuir no máximo 20 caracteres.'
            });
        }

        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({
                erro: 'CPF inválido. Verifique os números e os dígitos verificadores.'
            });
        }

        const resultado = await prisma.$transaction(async (tx) => {

            // Procura pessoa pelo CPF dentro do condomínio.
            const pessoaExistente = await tx.pessoas.findUnique({
                where: {
                    condominio_id_cpf: {
                        condominio_id: condominioId,
                        cpf: cpfLimpo
                    }
                }
            });

            let pessoa;
            let reutilizado = false;

            if (pessoaExistente) {
                if (!pessoaExistente.ativo) {
                    throw new Error('PESSOA_INATIVA');
                }

                if (pessoaExistente.tipo_pessoa !== 'VISITANTE') {
                    throw new Error('TIPO_PESSOA_DIFERENTE');
                }

                pessoa = pessoaExistente;
                reutilizado = true;

            } else {
                pessoa = await tx.pessoas.create({
                    data: {
                        condominio_id: condominioId,
                        nome: nomeLimpo,
                        cpf: cpfLimpo,
                        telefone: telefoneLimpo,
                        tipo_pessoa: 'VISITANTE',
                        observacao: observacaoLimpa,
                        ativo: true
                    }
                });
            }

            // Verifica se o visitante já está vinculado ao morador.
            const vinculoExistente =
                await tx.moradores_visitantes.findUnique({
                    where: {
                        morador_id_pessoa_id: {
                            morador_id: morador.id,
                            pessoa_id: pessoa.id
                        }
                    },
                    include: {
                        pessoas: true
                    }
                });

            let vinculo;

            if (vinculoExistente) {
                if (vinculoExistente.ativo) {
                    return {
                        vinculo: vinculoExistente,
                        reutilizado,
                        vinculoExistente: true
                    };
                }

                // Reativa somente o vínculo deste morador.
                vinculo = await tx.moradores_visitantes.update({
                    where: {
                        id: vinculoExistente.id
                    },
                    data: {
                        ativo: true,
                        updated_at: new Date()
                    },
                    include: {
                        pessoas: true
                    }
                });

            } else {
                // Cria novo vínculo sem duplicar a pessoa.
                vinculo = await tx.moradores_visitantes.create({
                    data: {
                        morador_id: morador.id,
                        pessoa_id: pessoa.id,
                        ativo: true
                    },
                    include: {
                        pessoas: true
                    }
                });
            }

            return {
                vinculo,
                reutilizado,
                vinculoExistente: false
            };
        });

        if (resultado.vinculoExistente) {
            return res.status(200).json({
                mensagem: 'Este visitante já está cadastrado para o seu apartamento.',
                reutilizado: resultado.reutilizado,
                visitante: formatarVisitante(resultado.vinculo)
            });
        }

        return res.status(201).json({
            mensagem: resultado.reutilizado
                ? 'Visitante existente vinculado ao seu cadastro com sucesso.'
                : 'Visitante cadastrado com sucesso.',
            reutilizado: resultado.reutilizado,
            visitante: formatarVisitante(resultado.vinculo)
        });

    } catch (error) {
        console.error('ERRO AO CADASTRAR VISITANTE:', error);

        const erros = {
            PESSOA_INATIVA: [
                400,
                'Já existe uma pessoa com este CPF, mas ela está inativa.'
            ],
            TIPO_PESSOA_DIFERENTE: [
                409,
                'Este CPF já está cadastrado com outro tipo de pessoa.'
            ]
        };

        if (erros[error.message]) {
            return res.status(erros[error.message][0]).json({
                erro: erros[error.message][1]
            });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({
                erro: 'Já existe um cadastro ou vínculo com os dados informados.'
            });
        }

        return res.status(500).json({
            erro: 'Erro ao cadastrar visitante.'
        });
    }
}

module.exports = {
    listarVisitantes,
    buscarVisitante,
    criarVisitante
};
