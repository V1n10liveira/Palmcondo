
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

    // Rejeita CPFs com todos os dígitos iguais.
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

    if (segundoDigito !== Number(cpf[10])) {
        return false;
    }

    return true;
}

// Formata os dados para evitar problemas com BigInt no JSON.
function formatarPrestador(prestador) {
    if (!prestador) return null;

    const pessoa = prestador.pessoas;

    return {
        id: String(prestador.id),
        pessoa_id: pessoa ? String(pessoa.id) : null,
        nome: pessoa?.nome || null,
        cpf: pessoa?.cpf || null,
        telefone: pessoa?.telefone || null,
        empresa: prestador.empresa,
        servico: prestador.servico,
        observacao: prestador.observacao,
        ativo: prestador.ativo,
        created_at: prestador.created_at,
        updated_at: prestador.updated_at
    };
}

// Verifica se o usuário possui perfil de MORADOR.
function validarPermissao(req, res) {
    if (req.user.tipo_usuario !== 'MORADOR') {
        res.status(403).json({
            erro: 'Somente moradores podem gerenciar prestadores particulares.'
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

    const morador = await prisma.moradores.findFirst({
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

    return morador;
}

// LISTAR PRESTADORES CADASTRADOS PELO MORADOR
async function listarPrestadores(req, res) {
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

        const prestadores = await prisma.prestadores.findMany({
            where: {
                morador_id: morador.id,
                ativo: true,
                pessoas: {
                    is: {
                        condominio_id: condominioId,
                        tipo_pessoa: 'PRESTADOR',
                        ativo: true
                    }
                }
            },
            include: {
                pessoas: true
            }
        });

        prestadores.sort((a, b) =>
            a.pessoas.nome.localeCompare(b.pessoas.nome)
        );

        return res.status(200).json({
            total: prestadores.length,
            prestadores: prestadores.map(formatarPrestador)
        });

    } catch (error) {
        console.error('ERRO AO LISTAR PRESTADORES:', error);

        return res.status(500).json({
            erro: 'Erro ao listar prestadores.'
        });
    }
}

// BUSCAR PRESTADOR POR ID
async function buscarPrestador(req, res) {
    try {
        if (!validarPermissao(req, res)) return;

        const condominioId = converterId(req.user.condominio_id);
        const morador = await obterMoradorAutenticado(req);
        const id = converterId(req.params.id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (!morador) {
            return res.status(403).json({
                erro: 'Morador não encontrado, inativo ou sem apartamento ativo no condomínio.'
            });
        }

        if (!id) {
            return res.status(400).json({
                erro: 'ID do prestador inválido.'
            });
        }

        const prestador = await prisma.prestadores.findFirst({
            where: {
                id,
                morador_id: morador.id,
                ativo: true,
                pessoas: {
                    is: {
                        condominio_id: condominioId,
                        tipo_pessoa: 'PRESTADOR',
                        ativo: true
                    }
                }
            },
            include: {
                pessoas: true
            }
        });

        if (!prestador) {
            return res.status(404).json({
                erro: 'Prestador não encontrado.'
            });
        }

        return res.status(200).json({
            prestador: formatarPrestador(prestador)
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR PRESTADOR:', error);

        return res.status(500).json({
            erro: 'Erro ao buscar prestador.'
        });
    }
}

// CADASTRAR OU REUTILIZAR PRESTADOR
async function criarPrestador(req, res) {
    try {
        if (!validarPermissao(req, res)) return;

        const condominioId = converterId(req.user.condominio_id);
        const morador = await obterMoradorAutenticado(req);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (!morador) {
            return res.status(403).json({
                erro: 'Morador não encontrado, inativo ou sem apartamento ativo no condomínio.'
            });
        }

        const {
            nome,
            cpf,
            telefone,
            empresa,
            servico,
            observacao
        } = req.body;

        if (!nome || !cpf || !empresa || !servico) {
            return res.status(400).json({
                erro: 'Nome, CPF, empresa e serviço são obrigatórios.'
            });
        }

        const nomeLimpo = String(nome).trim();
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        const empresaLimpa = String(empresa).trim();
        const servicoLimpo = String(servico).trim();

        if (!nomeLimpo || !empresaLimpa || !servicoLimpo) {
            return res.status(400).json({
                erro: 'Os campos obrigatórios não podem ficar vazios.'
            });
        }

        // Validação completa do CPF antes de consultar ou cadastrar a pessoa.
        if (!validarCPF(cpfLimpo)) {
            return res.status(400).json({
                erro: 'CPF inválido. Verifique os números e os dígitos verificadores.'
            });
        }

        const resultado = await prisma.$transaction(async (tx) => {

            const pessoaExistente = await tx.pessoas.findUnique({
                where: {
                    condominio_id_cpf: {
                        condominio_id: condominioId,
                        cpf: cpfLimpo
                    }
                }
            });

            let pessoa;
            let prestador;
            let reutilizado = false;
            let pertenceAoMorador = false;

            if (pessoaExistente) {
                if (!pessoaExistente.ativo) {
                    throw new Error('PESSOA_INATIVA');
                }

                if (pessoaExistente.tipo_pessoa !== 'PRESTADOR') {
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
                        telefone: telefone || null,
                        tipo_pessoa: 'PRESTADOR',
                        observacao: observacao || null,
                        ativo: true
                    }
                });
            }

            prestador = await tx.prestadores.findUnique({
                where: {
                    pessoa_id: pessoa.id
                }
            });

            if (prestador) {
                if (!prestador.ativo) {
                    throw new Error('PRESTADOR_INATIVO');
                }

                // Não transfere a responsabilidade do cadastro.
                pertenceAoMorador =
                    prestador.morador_id !== null &&
                    prestador.morador_id === morador.id;

            } else {
                prestador = await tx.prestadores.create({
                    data: {
                        pessoa_id: pessoa.id,
                        morador_id: morador.id,
                        empresa: empresaLimpa,
                        servico: servicoLimpo,
                        observacao: observacao || null,
                        ativo: true
                    }
                });

                pertenceAoMorador = true;
                reutilizado = false;
            }

            return {
                prestador,
                pessoa,
                reutilizado,
                pertenceAoMorador
            };
        });

        // Se o cadastro pertence a outro morador,
        // não retorna os dados particulares do prestador.
        if (resultado.reutilizado && !resultado.pertenceAoMorador) {
            return res.status(200).json({
                mensagem: 'Prestador já cadastrado no condomínio. O cadastro existente poderá ser utilizado em autorizações.',
                reutilizado: true
            });
        }

        return res.status(resultado.reutilizado ? 200 : 201).json({
            mensagem: resultado.reutilizado
                ? 'Prestador já cadastrado. Cadastro existente reutilizado.'
                : 'Prestador cadastrado com sucesso.',
            reutilizado: resultado.reutilizado,
            prestador: formatarPrestador({
                ...resultado.prestador,
                pessoas: resultado.pessoa
            })
        });

    } catch (error) {
        console.error('ERRO AO CADASTRAR PRESTADOR:', error);

        const erros = {
            PESSOA_INATIVA: [
                400,
                'Já existe uma pessoa com este CPF, mas ela está inativa.'
            ],
            TIPO_PESSOA_DIFERENTE: [
                409,
                'Este CPF já está cadastrado com outro tipo de pessoa.'
            ],
            PRESTADOR_INATIVO: [
                400,
                'O cadastro deste prestador está inativo.'
            ]
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
            erro: 'Erro ao cadastrar prestador.'
        });
    }
}

module.exports = {
    listarPrestadores,
    buscarPrestador,
    criarPrestador
};
