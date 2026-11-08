
const express = require('express');

const {
    listarAutorizacoes,
    buscarAutorizacao,
    criarAutorizacao,
    atualizarAutorizacao,
    excluirAutorizacao
} = require('../controllers/autorizacoes.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listarAutorizacoes);
router.get('/:id', authMiddleware, buscarAutorizacao);
router.post('/', authMiddleware, criarAutorizacao);
router.put('/:id', authMiddleware, atualizarAutorizacao);
router.delete('/:id', authMiddleware, excluirAutorizacao);

module.exports = router;
