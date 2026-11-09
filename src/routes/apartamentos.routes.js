
const express = require('express');

const {
    listarApartamentos,
    buscarApartamento,
    criarApartamento,
    atualizarApartamento,
    excluirApartamento,
    reativarApartamento
} = require('../controllers/apartamentos.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const permitirPerfis = require('../middlewares/permissao.middleware');

const router = express.Router();

// Lista apartamentos ativos
// Disponível para todos os usuários autenticados
router.get(
    '/',
    authMiddleware,
    listarApartamentos
);

// Busca apartamento por ID
// Disponível para todos os usuários autenticados
router.get(
    '/:id',
    authMiddleware,
    buscarApartamento
);

// Cadastra apartamento
// Somente MASTER e SINDICO
router.post(
    '/',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    criarApartamento
);

// Atualiza apartamento
// Somente MASTER e SINDICO
router.put(
    '/:id',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    atualizarApartamento
);

// Desativa apartamento
// Somente MASTER e SINDICO
router.delete(
    '/:id',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    excluirApartamento
);

// Reativa apartamento
// Somente MASTER e SINDICO
router.patch(
    '/:id/reativar',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    reativarApartamento
);

module.exports = router;
