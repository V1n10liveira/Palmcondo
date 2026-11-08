
function permitirPerfis(...perfisPermitidos) {
    return (req, res, next) => {
        try {
            // Verifica se o usuário está autenticado
            if (!req.user || !req.user.tipo_usuario) {
                return res.status(401).json({
                    erro: 'Usuário não autenticado.'
                });
            }

            // Obtém o perfil do usuário autenticado
            const perfil = req.user.tipo_usuario;

            // Verifica se o perfil possui permissão
            if (!perfisPermitidos.includes(perfil)) {
                return res.status(403).json({
                    erro: 'Você não possui permissão para executar esta ação.'
                });
            }

            next();

        } catch (error) {
            console.error('ERRO DE PERMISSÃO:', error);

            return res.status(500).json({
                erro: 'Erro ao verificar permissões.'
            });
        }
    };
}

module.exports = permitirPerfis;
