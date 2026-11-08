
const express = require('express');

const {
    criarUsuario,
    alterarSenha,
    redefinirSenha
} = require('../controllers/usuario.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const permitirPerfis = require('../middlewares/permissao.middleware');

const router = express.Router();

// Consulta os dados do usuário autenticado
router.get(
    '/me',
    authMiddleware,
    (req, res) => {
        return res.json({
            mensagem: 'Usuário autenticado com sucesso.',
            usuario: req.user
        });
    }
);

// Cadastro de moradores e colaboradores
// Somente MASTER e SINDICO possuem permissão
router.post(
    '/',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    criarUsuario
);

// Alterar senha do próprio usuário
router.put(
    '/alterar-senha',
    authMiddleware,
    alterarSenha
);

// Redefinir senha de um morador
// Somente MASTER e SINDICO possuem permissão
router.put(
    '/:id/redefinir-senha',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    redefinirSenha
);

module.exports = router;
