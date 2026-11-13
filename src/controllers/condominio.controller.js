
const prisma = require('../lib/prisma');

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
    buscarMeuCondominio,
    buscarCondominioPublico,
    listarApartamentosPublicos
};
