
const bcrypt = require('bcryptjs');
const readline = require('readline/promises');
const prisma = require('../src/lib/prisma');

async function criarMaster() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        console.log('\n=== CADASTRO DE USUÁRIO MASTER - PALMCONDO ===\n');

        // Verifica o condomínio utilizado como vínculo obrigatório.
        const condominio = await prisma.condominios.findUnique({
            where: { id: BigInt(1) },
            select: {
                id: true,
                nome: true,
                ativo: true
            }
        });

        if (!condominio || !condominio.ativo) {
            console.log('Condomínio ID 1 não encontrado ou inativo.');
            return;
        }

        console.log(`Condomínio de vínculo: ${condominio.nome}`);
        console.log(`ID: ${condominio.id}\n`);

        const nome = (await rl.question('Nome completo: ')).trim();
        const email = (await rl.question('E-mail: '))
            .trim()
            .toLowerCase();
        const cpf = (await rl.question('CPF: ')).trim();
        const senha = await rl.question('Senha: ');
        const confirmacao = await rl.question('Confirme a senha: ');

        if (!nome || !email || !cpf || !senha) {
            console.log('\nTodos os campos são obrigatórios.');
            return;
        }

        if (senha.length < 8) {
            console.log('\nA senha precisa ter pelo menos 8 caracteres.');
            return;
        }

        if (senha !== confirmacao) {
            console.log('\nAs senhas não são iguais.');
            return;
        }

        const usuarioExistente = await prisma.usuarios.findFirst({
            where: {
                OR: [
                    { email },
                    { cpf }
                ]
            },
            select: {
                email: true,
                cpf: true
            }
        });

        if (usuarioExistente) {
            if (usuarioExistente.email === email) {
                console.log('\nEste e-mail já está cadastrado.');
            }

            if (usuarioExistente.cpf === cpf) {
                console.log('\nEste CPF já está cadastrado.');
            }

            return;
        }

        console.log('\n=== CONFIRMAÇÃO DO CADASTRO ===');
        console.log('Nome:', nome);
        console.log('E-mail:', email);
        console.log('Perfil: MASTER');
        console.log('Condomínio de vínculo:', condominio.nome);

        const confirmar = await rl.question(
            '\nDeseja realmente criar este usuário? Digite SIM para confirmar: '
        );

        if (confirmar.trim().toUpperCase() !== 'SIM') {
            console.log('\nCadastro cancelado. Nenhum dado foi inserido.');
            return;
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const usuario = await prisma.usuarios.create({
            data: {
                condominio_id: condominio.id,
                nome,
                email,
                senha_hash: senhaHash,
                cpf,
                tipo_usuario: 'MASTER',
                ativo: true
            },
            select: {
                id: true,
                nome: true,
                email: true,
                tipo_usuario: true,
                ativo: true
            }
        });

        console.log('\nMASTER criado com sucesso!');
        console.log('ID:', usuario.id.toString());
        console.log('Nome:', usuario.nome);
        console.log('E-mail:', usuario.email);
        console.log('Perfil:', usuario.tipo_usuario);
        console.log('Ativo:', usuario.ativo);

    } catch (error) {
        console.error('\nErro ao criar usuário MASTER:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

criarMaster();
