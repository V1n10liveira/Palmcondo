
const prisma = require('../lib/prisma');

const FUSO_HORARIO = 'America/Sao_Paulo';

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

// Recupera data e horário atuais no fuso do condomínio.
function obterDataHoraAtual() {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO_HORARIO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(new Date());

    const valores = {};

    partes.forEach((parte) => {
        if (parte.type !== 'literal') {
            valores[parte.type] = parte.value;
        }
    });

    return {
        data: `${valores.year}-${valores.month}-${valores.day}`,
        minutos:
            Number(valores.hour) * 60 +
            Number(valores.minute)
    };
}

// Converte Date do Prisma para data no formato YYYY-MM-DD.
function formatarDataBanco(data) {
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

// Soma um dia a uma data YYYY-MM-DD.
function adicionarUmDia(data) {
    const [ano, mes, dia] = data.split('-').map(Number);

    const resultado = new Date(Date.UTC(ano, mes - 1, dia + 1));

    return formatarDataBanco(resultado);
}

// Converte HH:mm em minutos.
function converterHorarioParaMinutos(horario) {
    if (!/^\d{2}:\d{2}$/.test(horario || '')) {
        return null;
    }

    const [hora, minuto] = horario.split(':').map(Number);

    if (hora > 23 || minuto > 59) {
        return null;
    }

    return hora * 60 + minuto;
}

// Verifica se uma autorização está vigente neste momento.
function autorizacaoEstaVigente(autorizacao, dataAtual, minutosAtuais) {
    if (
        !autorizacao.data_inicio ||
        !autorizacao.data_fim ||
        !autorizacao.pessoas?.ativo
    ) {
        return false;
    }

    const dataInicio = formatarDataBanco(autorizacao.data_inicio);
    const dataFim = formatarDataBanco(autorizacao.data_fim);

    const inicio = converterHorarioParaMinutos(
        autorizacao.hora_inicio
    );

    const fim = converterHorarioParaMinutos(
        autorizacao.hora_fim
    );

    if (
        inicio === null ||
        fim === null ||
        dataAtual < dataInicio ||
        dataAtual > dataFim
    ) {
        return false;
    }

    // Autorização com intervalo de horário no mesmo dia.
    if (inicio <= fim) {
        return minutosAtuais >= inicio && minutosAtuais <= fim;
    }

    // Turno noturno: permanece associado ao dia inicial.
    const diaSeguinte = adicionarUmDia(dataInicio);

    const dentroDoTurnoNoturno =
        (
            dataAtual === dataInicio &&
            minutosAtuais >= inicio
        ) ||
        (
            dataAtual === diaSeguinte &&
            dataAtual <= dataFim &&
            minutosAtuais <= fim
        );

    return dentroDoTurnoNoturno;
}

// CONSULTAR INDICADORES DO DASHBOARD ADMINISTRATIVO.
async function obterDashboardMaster(req, res) {
    try {
        const condominioId = converterId(req.user?.condominio_id);

        if (!condominioId) {
            return res.status(401).json({
                erro: 'Dados de autenticação inválidos.'
            });
        }

        if (!['MASTER', 'SINDICO'].includes(req.user.tipo_usuario)) {
            return res.status(403).json({
                erro: 'Você não possui permissão para acessar o dashboard administrativo.'
            });
        }

        const condominio = await prisma.condominios.findUnique({
            where: {
                id: condominioId
            },
            select: {
                id: true,
                nome: true,
                cidade: true,
                estado: true,
                ativo: true
            }
        });

        if (!condominio) {
            return res.status(404).json({
                erro: 'Condomínio não encontrado.'
            });
        }

        const [
            totalApartamentos,
            totalMoradores,
            totalSolicitacoesPendentes,
            autorizacoes
        ] = await Promise.all([
            prisma.apartamentos.count({
                where: {
                    condominio_id: condominioId,
                    ativo: true
                }
            }),

            prisma.moradores.count({
                where: {
                    ativo: true,
                    usuarios: {
                        ativo: true
                    },
                    apartamentos: {
                        condominio_id: condominioId,
                        ativo: true
                    }
                }
            }),

            prisma.solicitacoes_acesso.count({
                where: {
                    condominio_id: condominioId,
                    status: 'PENDENTE'
                }
            }),

            prisma.autorizacoes.findMany({
                where: {
                    condominio_id: condominioId,
                    status: 'ATIVA',
                    pessoas: {
                        is: {
                            ativo: true
                        }
                    }
                },
                select: {
                    id: true,
                    data_inicio: true,
                    data_fim: true,
                    hora_inicio: true,
                    hora_fim: true,
                    pessoas: {
                        select: {
                            ativo: true
                        }
                    }
                }
            })
        ]);

        const agora = obterDataHoraAtual();

        const totalAutorizacoesVigentes = autorizacoes.filter(
            (autorizacao) =>
                autorizacaoEstaVigente(
                    autorizacao,
                    agora.data,
                    agora.minutos
                )
        ).length;

        return res.status(200).json({
            condominio: {
                id: String(condominio.id),
                nome: condominio.nome,
                cidade: condominio.cidade,
                estado: condominio.estado,
                ativo: condominio.ativo
            },
            indicadores: {
                apartamentos_ativos: totalApartamentos,
                moradores_ativos: totalMoradores,
                solicitacoes_pendentes: totalSolicitacoesPendentes,
                autorizacoes_vigentes: totalAutorizacoesVigentes
            },
            atualizado_em: new Date().toISOString(),
            fuso_horario: FUSO_HORARIO
        });

    } catch (error) {
        console.error('ERRO AO CONSULTAR DASHBOARD:', error);

        return res.status(500).json({
            erro: 'Erro ao carregar os indicadores do dashboard.'
        });
    }
}

module.exports = {
    obterDashboardMaster
};
