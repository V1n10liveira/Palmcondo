const prisma = require('../lib/prisma');

const TEMPO_AUTORIZACAO_HORAS = 24;
const INTERVALO_VERIFICACAO_MS = 60 * 1000;

// Expira autorizações de visitantes cujo prazo de 24 horas terminou.
async function expirarAutorizacoesVencidas() {
    try {
        const limiteExpiracao = new Date(
            Date.now() - TEMPO_AUTORIZACAO_HORAS * 60 * 60 * 1000
        );

        const resultado = await prisma.solicitacoes_acesso.updateMany({
            where: {
                tipo_pessoa: 'VISITANTE',
                status: 'AUTORIZADA',
                data_hora_resposta: {
                    lte: limiteExpiracao
                }
            },
            data: {
                status: 'EXPIRADA'
            }
        });

        if (resultado.count > 0) {
            console.log(
                `[EXPIRAÇÃO] ${resultado.count} autorização(ões) expirada(s).`
            );
        }

        return resultado.count;

    } catch (error) {
        console.error(
            '[EXPIRAÇÃO] Erro ao expirar autorizações:',
            error
        );

        return 0;
    }
}

// Inicia o serviço automático.
function iniciarServicoExpiracao() {
    console.log('[EXPIRAÇÃO] Serviço iniciado.');

    // Verifica autorizações vencidas ao iniciar a API.
    expirarAutorizacoesVencidas();

    // Executa nova verificação a cada minuto.
    const intervalo = setInterval(
        expirarAutorizacoesVencidas,
        INTERVALO_VERIFICACAO_MS
    );

    return intervalo;
}

module.exports = {
    iniciarServicoExpiracao,
    expirarAutorizacoesVencidas
};