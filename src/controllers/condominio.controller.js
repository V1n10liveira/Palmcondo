
const crypto = require('crypto');
const prisma = require('../lib/prisma');

// GERA UM CÓDIGO PÚBLICO ÚNICO PARA O CONDOMÍNIO.
async function gerarCodigoPublico() {
    let codigo;
    let existente;

    do {
        codigo = `PC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

        existente = await prisma.condominios.findUnique({
            where: {
                codigo_publico: codigo
            }
        });
    } while (existente);

    return codigo;
}

// NORMALIZA E VALIDA CNPJ.
function validarCnpj(cnpj) {
    const digitos = cnpj.replace(/\D/g, '');

    if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) {
        return false;
    }

    const calcularDigito = (base, pesos) => {
        const soma = base
            .split('')
            .reduce((total, digito, indice) => {
                return total + Number(digito) * pesos[indice];
            }, 0);

        const resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroDigito = calcularDigito(
        digitos.substring(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    const segundoDigito = calcularDigito(
        digitos.substring(0, 12) + primeiroDigito,
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return digitos === digitos.substring(0, 12) +
        primeiroDigito +
        segundoDigito;
}

// CADASTRAR NOVO CONDOMÍNIO (ACESSO EXCLUSIVO MASTER).
async function criarCondominioMaster(req, res) {
    try {
        const {
            nome,
            cnpj,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep,
            telefone,
            email
        } = req.body;

        // VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS.
        if (
            !nome?.trim() ||
            !endereco?.trim() ||
            !cidade?.trim() ||
            !estado?.trim()
        ) {
            return res.status(400).json({
                erro: 'Informe nome, endereço, cidade e estado.'
            });
        }

        const dadosObrigatorios = [
            { campo: 'nome', valor: nome.trim(), limite: 150 },
            { campo: 'endereco', valor: endereco.trim(), limite: 200 },
            { campo: 'cidade', valor: cidade.trim(), limite: 100 }
        ];

        for (const item of dadosObrigatorios) {
            if (item.valor.length > item.limite) {
                return res.status(400).json({
                    erro: `O campo ${item.campo} ultrapassa o limite de ${item.limite} caracteres.`
                });
            }
        }

        const estadoNormalizado = estado.trim().toUpperCase();

        if (!/^[A-Z]{2}$/.test(estadoNormalizado)) {
            return res.status(400).json({
                erro: 'Informe uma sigla de estado válida com duas letras.'
            });
        }

        // VALIDAÇÃO DO CNPJ, QUANDO INFORMADO.
        let cnpjNormalizado = null;

        if (cnpj && String(cnpj).trim()) {
            cnpjNormalizado = String(cnpj).replace(/\D/g, '');

            if (!validarCnpj(cnpjNormalizado)) {
                return res.status(400).json({
                    erro: 'CNPJ inválido.'
                });
            }

            const cnpjExistente = await prisma.condominios.findUnique({
                where: {
                    cnpj: cnpjNormalizado
                }
            });

            if (cnpjExistente) {
                return res.status(409).json({
                    erro: 'Já existe um condomínio cadastrado com este CNPJ.'
                });
            }
        }

        // GERA O CÓDIGO PÚBLICO.
        const codigoPublico = await gerarCodigoPublico();

        // CRIA O CONDOMÍNIO.
        const condominio = await prisma.condominios.create({
            data: {
                nome: nome.trim(),
                cnpj: cnpjNormalizado,
                codigo_publico: codigoPublico,
                endereco: endereco.trim(),
                numero: numero?.trim() || null,
                complemento: complemento?.trim() || null,
                bairro: bairro?.trim() || null,
                cidade: cidade.trim(),
                estado: estadoNormalizado,
                cep: cep?.trim() || null,
                telefone: telefone?.trim() || null,
                email: email?.trim() || null,
                ativo: true
            },
            select: {
                id: true,
                nome: true,
                codigo_publico: true,
                cnpj: true,
                endereco: true,
                numero: true,
                complemento: true,
                bairro: true,
                cidade: true,
                estado: true,
                cep: true,
                telefone: true,
                email: true,
                ativo: true,
                created_at: true
            }
        });

        return res.status(201).json({
            mensagem: 'Condomínio cadastrado com sucesso.',
            condominio: {
                ...condominio,
                id: String(condominio.id)
            }
        });

    } catch (error) {
        console.error('ERRO AO CADASTRAR CONDOMÍNIO:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                erro: 'Já existe um cadastro com uma informação única informada.'
            });
        }

        return res.status(500).json({
            erro: 'Erro interno ao cadastrar condomínio.'
        });
    }
}

// LISTAR TODOS OS CONDOMÍNIOS (ACESSO EXCLUSIVO MASTER).
async function listarCondominiosMaster(req, res) {
    try {
        const condominios = await prisma.condominios.findMany({
            select: {
                id: true,
                nome: true,
                cidade: true,
                estado: true,
                ativo: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: {
                        apartamentos: true,
                        usuarios: true,
                        solicitacoes_acesso: true,
                        autorizacoes: true
                    }
                }
            },
            orderBy: {
                nome: 'asc'
            }
        });

        return res.status(200).json({
            total: condominios.length,
            condominios: condominios.map(condominio => ({
                id: String(condominio.id),
                nome: condominio.nome,
                cidade: condominio.cidade,
                estado: condominio.estado,
                ativo: condominio.ativo,
                created_at: condominio.created_at,
                updated_at: condominio.updated_at,
                totais: {
                    apartamentos: condominio._count.apartamentos,
                    usuarios: condominio._count.usuarios,
                    solicitacoes: condominio._count.solicitacoes_acesso,
                    autorizacoes: condominio._count.autorizacoes
                }
            }))
        });

    } catch (error) {
        console.error('ERRO AO LISTAR CONDOMÍNIOS:', error);

        return res.status(500).json({
            erro: 'Erro interno ao listar condomínios.'
        });
    }
}

// CONSULTAR CONDOMÍNIO DO USUÁRIO AUTENTICADO.
async function buscarMeuCondominio(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);

        const condominio = await prisma.condominios.findUnique({
            where: {
                id: condominioId
            }
        });

        if (!condominio) {
            return res.status(404).json({
                erro: 'Condomínio não encontrado.'
            });
        }

        return res.json({
            condominio: {
                id: String(condominio.id),
                nome: condominio.nome,
                cnpj: condominio.cnpj,
                endereco: condominio.endereco,
                numero: condominio.numero,
                complemento: condominio.complemento,
                bairro: condominio.bairro,
                cidade: condominio.cidade,
                estado: condominio.estado,
                cep: condominio.cep,
                telefone: condominio.telefone,
                email: condominio.email,
                ativo: condominio.ativo,
                created_at: condominio.created_at,
                updated_at: condominio.updated_at
            }
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR CONDOMÍNIO:', error);

        return res.status(500).json({
            erro: 'Erro interno ao buscar condomínio.'
        });
    }
}

// CONSULTAR CONDOMÍNIO PELO CÓDIGO PÚBLICO.
async function buscarCondominioPublico(req, res) {
    try {
        const codigo = String(req.params.codigo || '').trim().toUpperCase();

        if (!codigo || codigo.length > 64) {
            return res.status(400).json({
                erro: 'Código público inválido.'
            });
        }

        const condominio = await prisma.condominios.findUnique({
            where: {
                codigo_publico: codigo
            },
            select: {
                id: true,
                nome: true,
                codigo_publico: true,
                ativo: true
            }
        });

        if (!condominio || !condominio.ativo) {
            return res.status(404).json({
                erro: 'Condomínio não encontrado ou inativo.'
            });
        }

        return res.status(200).json({
            condominio: {
                nome: condominio.nome,
                codigo_publico: condominio.codigo_publico
            }
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR CONDOMÍNIO PÚBLICO:', error);

        return res.status(500).json({
            erro: 'Erro ao consultar condomínio.'
        });
    }
}

// LISTAR APARTAMENTOS DISPONÍVEIS PELO CÓDIGO PÚBLICO.
async function listarApartamentosPublicos(req, res) {
    try {
        const codigo = String(req.params.codigo || '').trim().toUpperCase();

        if (!codigo || codigo.length > 64) {
            return res.status(400).json({
                erro: 'Código público inválido.'
            });
        }

        const condominio = await prisma.condominios.findUnique({
            where: {
                codigo_publico: codigo
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

        const apartamentos = await prisma.apartamentos.findMany({
            where: {
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

        return res.status(200).json({
            total: apartamentos.length,
            apartamentos: apartamentos.map(apartamento => ({
                id: String(apartamento.id),
                bloco: apartamento.bloco,
                numero: apartamento.numero
            }))
        });

    } catch (error) {
        console.error('ERRO AO LISTAR APARTAMENTOS PÚBLICOS:', error);

        return res.status(500).json({
            erro: 'Erro ao consultar apartamentos.'
        });
    }
}

module.exports = {
    criarCondominioMaster,
    listarCondominiosMaster,
    buscarMeuCondominio,
    buscarCondominioPublico,
    listarApartamentosPublicos
};
