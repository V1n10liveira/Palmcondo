
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

// LISTAR NOTIFICAÇÕES DO USUÁRIO AUTENTICADO.
async function listarNotificacoes(req, res) {
    try {
        const usuarioId = converterId(req.user?.id);

        if (!usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const [notificacoes, totalNaoLidas] = await Promise.all([
            prisma.notificacoes.findMany({
                where: {
                    usuario_id: usuarioId
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 50
            }),

            prisma.notificacoes.count({
                where: {
                    usuario_id: usuarioId,
                    lida: false
                }
            })
        ]);

        return res.status(200).json({
            total: notificacoes.length,
            total_nao_lidas: totalNaoLidas,
            notificacoes: notificacoes.map((notificacao) => ({
                id: String(notificacao.id),
                titulo: notificacao.titulo,
                mensagem: notificacao.mensagem,
                tipo: notificacao.tipo,
                lida: notificacao.lida,
                created_at: notificacao.created_at
            }))
        });

    } catch (error) {
        console.error('ERRO AO LISTAR NOTIFICAÇÕES:', error);

        return res.status(500).json({
            erro: 'Erro ao listar notificações.'
        });
    }
}

// MARCAR UMA NOTIFICAÇÃO COMO LIDA.
async function marcarNotificacaoComoLida(req, res) {
    try {
        const usuarioId = converterId(req.user?.id);
        const notificacaoId = converterId(req.params.id);

        if (!usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (!notificacaoId) {
            return res.status(400).json({
                erro: 'ID da notificação inválido.'
            });
        }

        const resultado = await prisma.notificacoes.updateMany({
            where: {
                id: notificacaoId,
                usuario_id: usuarioId,
                lida: false
            },
            data: {
                lida: true
            }
        });

        if (resultado.count === 0) {
            const notificacao = await prisma.notificacoes.findFirst({
                where: {
                    id: notificacaoId,
                    usuario_id: usuarioId
                },
                select: {
                    id: true,
                    lida: true
                }
            });

            if (!notificacao) {
                return res.status(404).json({
                    erro: 'Notificação não encontrada.'
                });
            }
        }

        return res.status(200).json({
            mensagem: 'Notificação marcada como lida.'
        });

    } catch (error) {
        console.error('ERRO AO MARCAR NOTIFICAÇÃO COMO LIDA:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar notificação.'
        });
    }
}

// MARCAR TODAS AS NOTIFICAÇÕES DO USUÁRIO COMO LIDAS.
async function marcarTodasComoLidas(req, res) {
    try {
        const usuarioId = converterId(req.user?.id);

        if (!usuarioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        const resultado = await prisma.notificacoes.updateMany({
            where: {
                usuario_id: usuarioId,
                lida: false
            },
            data: {
                lida: true
            }
        });

        return res.status(200).json({
            mensagem: 'Notificações atualizadas com sucesso.',
            total_atualizadas: resultado.count
        });

    } catch (error) {
        console.error('ERRO AO MARCAR TODAS AS NOTIFICAÇÕES COMO LIDAS:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar notificações.'
        });
    }
}

module.exports = {
    listarNotificacoes,
    marcarNotificacaoComoLida,
    marcarTodasComoLidas
};
