
const prisma = require('../lib/prisma');

const TEMPO_AUTORIZACAO_HORAS = 24;
const TEMPO_AUTORIZACAO_MS = TEMPO_AUTORIZACAO_HORAS * 60 * 60 * 1000;
const INTERVALO_VERIFICACAO_MS = 60 * 1000;

const TIPOS_PESSOA_PERMITIDOS = ['VISITANTE', 'PRESTADOR'];

// Expira autorizações vencidas de visitantes e prestadores.
async function expirarAutorizacoesVencidas() {
    try {
        const agora = new Date();

        const limiteExpiracao = new Date(
            agora.getTime() - TEMPO_AUTORIZACAO_MS
        );

        const resultado = await prisma.solicitacoes_acesso.updateMany({
            where: {
                tipo_pessoa: {
                    in: TIPOS_PESSOA_PERMITIDOS
                },
                status: 'AUTORIZADA',
                OR: [
                    {
                        codigo_expira_em: {
                            lte: agora
                        }
                    },
                    {
                        codigo_expira_em: null,
                        data_hora_resposta: {
                            lte: limiteExpiracao
                        }
                    }
                ]
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
