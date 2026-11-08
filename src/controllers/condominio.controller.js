const prisma = require('../lib/prisma');

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
        console.error(error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    buscarMeuCondominio
};