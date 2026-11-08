/**
 * SCRIPT OPERACIONAL: CRIAÇÃO DE APARTAMENTOS
 *
 * Este script cadastra apartamentos do número 102 ao 199,
 * todos no bloco A, vinculados ao condomínio de ID 1.
 *
 * ATENÇÃO:
 * - Confira o condominio_id antes de executar.
 * - Não execute em outro ambiente sem revisar os dados.
 * - O script realiza inserções diretamente no banco de dados.
 * - Apartamentos duplicados são ignorados.
 *
 * Este arquivo não deve ser executado automaticamente
 * durante a inicialização da API.
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function criarApartamentos() {
    try {
        const apartamentos = [];

        for (let numero = 102; numero <= 199; numero++) {
            const andar = Math.floor((numero - 101) / 10) + 1;

            apartamentos.push({
                condominio_id: 1,
                bloco: 'A',
                numero: String(numero),
                andar: String(andar),
                descricao: `Apartamento ${numero}`,
                ativo: true
            });
        }

        const resultado = await prisma.apartamentos.createMany({
            data: apartamentos,
            skipDuplicates: true
        });

        console.log(`${resultado.count} apartamentos criados com sucesso.`);
    } catch (error) {
        console.error('Erro ao criar apartamentos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

criarApartamentos();