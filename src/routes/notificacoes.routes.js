
const express = require('express');

const {
    listarNotificacoes,
    marcarNotificacaoComoLida,
    marcarTodasComoLidas
} = require('../controllers/notificacoes.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas as rotas exigem autenticação.
router.use(authMiddleware);

// Lista notificações do usuário autenticado.
router.get('/', listarNotificacoes);

// Marca uma notificação específica como lida.
router.patch('/:id/lida', marcarNotificacaoComoLida);

// Marca todas as notificações como lidas.
router.patch('/lidas/todas', marcarTodasComoLidas);

module.exports = router;
