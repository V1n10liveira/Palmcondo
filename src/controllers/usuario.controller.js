
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function criarUsuario(req, res) {
    try {
        const condominioId = BigInt(req.user.condominio_id);

        const {
            nome,
            email,
            senha,
            cpf,
            telefone,
            tipo_usuario
        } = req.body;

        if (!nome || !email || !senha || !cpf || !tipo_usuario) {
            return res.status(400).json({
                erro: 'Nome, e-mail, senha, CPF e tipo de usuário são obrigatórios.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                erro: 'A senha precisa ter pelo menos 8 caracteres.'
            });
        }

        const tiposPermitidos = [
            'MORADOR',
            'COLABORADOR'
        ];

        if (!tiposPermitidos.includes(tipo_usuario)) {
            return res.status(400).json({
                erro: 'Tipo de usuário inválido para cadastro.'
            });
        }

        const usuarioExistente = await prisma.usuarios.findFirst({
            where: {
                OR: [
                    { email: email },
                    { cpf: cpf }
                ]
            }
        });

        if (usuarioExistente) {
            if (usuarioExistente.email === email) {
                return res.status(400).json({
                    erro: 'Já existe um usuário cadastrado com este e-mail.'
                });
            }

            if (usuarioExistente.cpf === cpf) {
                return res.status(400).json({
                    erro: 'Já existe um usuário cadastrado com este CPF.'
                });
            }
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const usuario = await prisma.usuarios.create({
            data: {
                condominio_id: condominioId,
                nome,
                email,
                senha_hash: senhaHash,
                cpf,
                telefone: telefone || null,
                tipo_usuario,
                ativo: true
            }
        });

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.',
            usuario: {
                id: String(usuario.id),
                condominio_id: String(usuario.condominio_id),
                nome: usuario.nome,
                email: usuario.email,
                cpf: usuario.cpf,
                telefone: usuario.telefone,
                tipo_usuario: usuario.tipo_usuario,
                ativo: usuario.ativo,
                created_at: usuario.created_at,
                updated_at: usuario.updated_at
            }
        });

    } catch (error) {
        console.error('ERRO AO CADASTRAR USUÁRIO:', error);

        return res.status(500).json({
            erro: 'Erro ao cadastrar usuário.'
        });
    }
}


// ALTERAR SENHA DO USUÁRIO AUTENTICADO
async function alterarSenha(req, res) {
    try {
        const usuarioId = BigInt(req.user.id);
        const condominioId = BigInt(req.user.condominio_id);

        const {
            senha_atual,
            nova_senha,
            confirmar_senha
        } = req.body;

        if (!senha_atual || !nova_senha || !confirmar_senha) {
            return res.status(400).json({
                erro: 'Preencha a senha atual, a nova senha e a confirmação.'
            });
        }

        if (nova_senha.length < 8) {
            return res.status(400).json({
                erro: 'A nova senha precisa ter pelo menos 8 caracteres.'
            });
        }

        if (nova_senha !== confirmar_senha) {
            return res.status(400).json({
                erro: 'A nova senha e a confirmação não são iguais.'
            });
        }

        if (senha_atual === nova_senha) {
            return res.status(400).json({
                erro: 'A nova senha deve ser diferente da senha atual.'
            });
        }

        const usuario = await prisma.usuarios.findFirst({
            where: {
                id: usuarioId,
                condominio_id: condominioId,
                ativo: true
            }
        });

        if (!usuario) {
            return res.status(404).json({
                erro: 'Usuário não encontrado ou inativo.'
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha_atual,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: 'A senha atual está incorreta.'
            });
        }

        const novaSenhaHash = await bcrypt.hash(nova_senha, 10);

        await prisma.usuarios.update({
            where: {
                id: usuarioId
            },
            data: {
                senha_hash: novaSenhaHash
            }
        });

        return res.json({
            mensagem: 'Senha alterada com sucesso.'
        });

    } catch (error) {
        console.error('ERRO AO ALTERAR SENHA:', error);

        return res.status(500).json({
            erro: 'Erro ao alterar senha.'
        });
    }
}


// REDEFINIR SENHA DE UM MORADOR PELO SÍNDICO
async function redefinirSenha(req, res) {
    try {
        const id = req.params.id;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                erro: 'ID do usuário inválido.'
            });
        }

        const usuarioId = BigInt(id);
        const condominioId = BigInt(req.user.condominio_id);

        const {
            nova_senha,
            confirmar_senha
        } = req.body;

        if (!nova_senha || !confirmar_senha) {
            return res.status(400).json({
                erro: 'Nova senha e confirmação são obrigatórias.'
            });
        }

        if (nova_senha.length < 8) {
            return res.status(400).json({
                erro: 'A nova senha precisa ter pelo menos 8 caracteres.'
            });
        }

        if (nova_senha !== confirmar_senha) {
            return res.status(400).json({
                erro: 'A nova senha e a confirmação não são iguais.'
            });
        }

        const usuario = await prisma.usuarios.findFirst({
            where: {
                id: usuarioId,
                condominio_id: condominioId,
                tipo_usuario: 'MORADOR',
                ativo: true
            }
        });

        if (!usuario) {
            return res.status(404).json({
                erro: 'Morador não encontrado ou inativo neste condomínio.'
            });
        }

        const morador = await prisma.moradores.findFirst({
            where: {
                usuario_id: usuarioId,
                ativo: true
            }
        });

        if (!morador) {
            return res.status(404).json({
                erro: 'Cadastro de morador não encontrado ou inativo.'
            });
        }

        const novaSenhaHash = await bcrypt.hash(nova_senha, 10);

        await prisma.usuarios.update({
            where: {
                id: usuarioId
            },
            data: {
                senha_hash: novaSenhaHash
            }
        });

        return res.json({
            mensagem: 'Senha do morador redefinida com sucesso.',
            usuario: {
                id: String(usuario.id),
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error('ERRO AO REDEFINIR SENHA:', error);

        return res.status(500).json({
            erro: 'Erro ao redefinir senha do morador.'
        });
    }
}


module.exports = {
    criarUsuario,
    alterarSenha,
    redefinirSenha
};
