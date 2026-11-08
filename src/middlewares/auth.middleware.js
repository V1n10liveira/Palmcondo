
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: 'Token não informado'
            });
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                error: 'Formato do token inválido'
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Consulta o usuário diretamente no banco
        const usuario = await prisma.usuarios.findUnique({
            where: {
                id: BigInt(decoded.id)
            }
        });

        if (!usuario || !usuario.ativo) {
            return res.status(401).json({
                error: 'Usuário inativo ou não encontrado.'
            });
        }

        // Verifica se o morador continua ativo
        if (usuario.tipo_usuario === 'MORADOR') {
            const moradorAtivo = await prisma.moradores.findFirst({
                where: {
                    usuario_id: usuario.id,
                    ativo: true
                }
            });

            if (!moradorAtivo) {
                return res.status(401).json({
                    error: 'Cadastro de morador inativo.'
                });
            }
        }

        // Utiliza os dados atuais do banco, não os dados antigos do token
        req.user = {
            id: String(usuario.id),
            condominio_id: String(usuario.condominio_id),
            tipo_usuario: usuario.tipo_usuario
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token inválido ou expirado'
            });
        }

        console.error('ERRO NA AUTENTICAÇÃO:', error);

        return res.status(500).json({
            error: 'Erro ao verificar autenticação.'
        });
    }
}

module.exports = authMiddleware;
