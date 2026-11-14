
const prisma = require('../lib/prisma');

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

module.exports = {
    criarSolicitacaoPublica
};
