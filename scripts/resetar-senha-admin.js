
const bcrypt = require('bcryptjs');
const readline = require('readline/promises');
const prisma = require('../src/lib/prisma');

async function resetarSenha() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        console.log('\n=== RECUPERAÇÃO DE SENHA PALMCONDO ===\n');

        const email = await rl.question('Digite o e-mail do usuário: ');

        const usuario = await prisma.usuarios.findUnique({
            where: { email }
        });

        if (!usuario) {
            console.log('\nUsuário não encontrado.');
            return;
        }

        if (!usuario.ativo) {
            console.log('\nEste usuário está inativo.');
            return;
        }

        console.log('\nUsuário encontrado:', usuario.nome);
        console.log('Perfil:', usuario.tipo_usuario);

        const senha = await rl.question('\nDigite a nova senha: ');
        const confirmacao = await rl.question('Confirme a nova senha: ');

        if (senha.length < 8) {
            console.log('\nA senha precisa ter pelo menos 8 caracteres.');
            return;
        }

        if (senha !== confirmacao) {
            console.log('\nAs senhas não são iguais.');
            return;
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        await prisma.usuarios.update({
            where: { email },
            data: { senha_hash: senhaHash }
        });

        console.log('\nSenha redefinida com sucesso!');
        console.log('E-mail:', email);
        console.log('Perfil:', usuario.tipo_usuario);

    } catch (error) {
        console.error('\nErro ao redefinir senha:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

resetarSenha();