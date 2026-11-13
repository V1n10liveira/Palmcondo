
/**
 * SCRIPT OPERACIONAL: GERAÇÃO DO CÓDIGO PÚBLICO
 *
 * Gera um código aleatório para o condomínio de ID 1.
 *
 * ATENÇÃO:
 * - Não sobrescreve códigos existentes.
 * - Verifica se o código já está em uso.
 * - Atualiza somente o campo codigo_publico.
 * - Executar manualmente, nunca durante a inicialização da API.
 */

require('dotenv').config();

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function gerarCodigoPublico() {
    try {
        const condominio = await prisma.condominios.findUnique({
            where: {
                id: BigInt(1)
            }
        });

        if (!condominio) {
            console.log('Condomínio de ID 1 não encontrado.');
            return;
        }

        if (condominio.codigo_publico) {
            console.log(
                `O condomínio já possui código: ${condominio.codigo_publico}`
            );
            return;
        }

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

        await prisma.condominios.update({
            where: {
                id: BigInt(1)
            },
            data: {
                codigo_publico: codigo
            }
        });

        console.log('Código público gerado com sucesso!');
        console.log(`Condomínio: ${condominio.nome}`);
        console.log(`Código: ${codigo}`);

    } catch (error) {
        console.error('Erro ao gerar código público:', error);
    } finally {
        await prisma.$disconnect();
    }
}

gerarCodigoPublico();