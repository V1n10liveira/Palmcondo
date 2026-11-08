
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function login(req, res) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                erro: 'E-mail e senha são obrigatórios.'
            });
        }

        // Remove espaços antes e depois do e-mail
        const emailNormalizado = email.trim();

        // Verifica se o segredo JWT está configurado
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET não configurado.');

            return res.status(500).json({
                erro: 'Erro interno do servidor.'
            });
        }

        const usuario = await prisma.usuarios.findUnique({
            where: {
                email: emailNormalizado
            }
        });

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos.'
            });
        }

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: 'E-mail ou senha inválidos.'
            });
        }

        // Verifica se o morador possui cadastro ativo
        if (usuario.tipo_usuario === 'MORADOR') {
            const moradorAtivo = await prisma.moradores.findFirst({
                where: {
                    usuario_id: usuario.id,
                    ativo: true
                }
            });

            if (!moradorAtivo) {
                return res.status(401).json({
                    erro: 'E-mail ou senha inválidos.'
                });
            }
        }

        const token = jwt.sign(
            {
                id: String(usuario.id),
                condominio_id: String(usuario.condominio_id),
                tipo_usuario: usuario.tipo_usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        return res.json({
            mensagem: 'Login realizado com sucesso.',
            token: token,
            usuario: {
                id: String(usuario.id),
                nome: usuario.nome,
                email: usuario.email,
                tipo_usuario: usuario.tipo_usuario
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
    login
};
