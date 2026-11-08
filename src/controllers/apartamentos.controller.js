const prisma = require('../lib/prisma');

async function listarApartamentos(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);

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
            apartamentos: apartamentos.map(apartamento => ({
                id: String(apartamento.id),
                condominio_id: String(apartamento.condominio_id),
                bloco: apartamento.bloco,
                numero: apartamento.numero,
                andar: apartamento.andar,
                descricao: apartamento.descricao,
                ativo: apartamento.ativo,
                created_at: apartamento.created_at,
                updated_at: apartamento.updated_at
            }))
        });

    } catch (error) {
        console.error('ERRO AO LISTAR APARTAMENTOS:', error);

        return res.status(500).json({
            erro: 'Erro ao listar apartamentos.'
        });
    }
}

async function criarApartamento(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);

        const {
            bloco,
            numero,
            andar,
            descricao
        } = req.body;

        if (numero === undefined || numero === null || numero === '') {
            return res.status(400).json({
                erro: 'Número do apartamento é obrigatório.'
            });
        }

        const apartamento = await prisma.apartamentos.create({
            data: {
                condominio_id: condominioId,
                bloco: bloco ? String(bloco) : null,
                numero: String(numero),
                andar:
                    andar !== undefined &&
                    andar !== null &&
                    andar !== ''
                        ? String(andar)
                        : null,
                descricao: descricao ? String(descricao) : null
            }
        });

        return res.status(201).json({
            mensagem: 'Apartamento cadastrado com sucesso.',
            apartamento: {
                id: String(apartamento.id),
                condominio_id: String(apartamento.condominio_id),
                bloco: apartamento.bloco,
                numero: apartamento.numero,
                andar: apartamento.andar,
                descricao: apartamento.descricao,
                ativo: apartamento.ativo
            }
        });

    } catch (error) {
        console.error('ERRO AO CADASTRAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao cadastrar apartamento.'
        });
    }
}

async function buscarApartamento(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);
        const apartamentoId = BigInt(req.params.id);

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
            apartamento: {
                id: String(apartamento.id),
                condominio_id: String(apartamento.condominio_id),
                bloco: apartamento.bloco,
                numero: apartamento.numero,
                andar: apartamento.andar,
                descricao: apartamento.descricao,
                ativo: apartamento.ativo,
                created_at: apartamento.created_at,
                updated_at: apartamento.updated_at
            }
        });

    } catch (error) {
        console.error('ERRO AO BUSCAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao buscar apartamento.'
        });
    }
}

async function atualizarApartamento(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);
        const apartamentoId = BigInt(req.params.id);

        const {
            bloco,
            numero,
            andar,
            descricao
        } = req.body;

        if (numero === undefined || numero === null || numero === '') {
            return res.status(400).json({
                erro: 'Número do apartamento é obrigatório.'
            });
        }

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

        const apartamento = await prisma.apartamentos.update({
            where: {
                id: apartamentoId
            },
            data: {
                bloco: bloco ? String(bloco) : null,
                numero: String(numero),
                andar:
                    andar !== undefined &&
                    andar !== null &&
                    andar !== ''
                        ? String(andar)
                        : null,
                descricao: descricao ? String(descricao) : null
            }
        });

        return res.json({
            mensagem: 'Apartamento atualizado com sucesso.',
            apartamento: {
                id: String(apartamento.id),
                condominio_id: String(apartamento.condominio_id),
                bloco: apartamento.bloco,
                numero: apartamento.numero,
                andar: apartamento.andar,
                descricao: apartamento.descricao,
                ativo: apartamento.ativo,
                created_at: apartamento.created_at,
                updated_at: apartamento.updated_at
            }
        });

    } catch (error) {
        console.error('ERRO AO ATUALIZAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar apartamento.'
        });
    }
}

async function excluirApartamento(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);
        const apartamentoId = BigInt(req.params.id);

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

        const apartamento = await prisma.apartamentos.update({
            where: {
                id: apartamentoId
            },
            data: {
                ativo: false
            }
        });

        return res.json({
            mensagem: 'Apartamento desativado com sucesso.',
            apartamento: {
                id: String(apartamento.id),
                condominio_id: String(apartamento.condominio_id),
                bloco: apartamento.bloco,
                numero: apartamento.numero,
                andar: apartamento.andar,
                descricao: apartamento.descricao,
                ativo: apartamento.ativo
            }
        });

    } catch (error) {
        console.error('ERRO AO DESATIVAR APARTAMENTO:', error);

        return res.status(500).json({
            erro: 'Erro ao desativar apartamento.'
        });
    }
}

module.exports = {
    listarApartamentos,
    criarApartamento,
    buscarApartamento,
    atualizarApartamento,
    excluirApartamento
};