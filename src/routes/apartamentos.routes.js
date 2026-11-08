const express = require('express');

const {
    listarApartamentos,
    buscarApartamento,
    criarApartamento,
    atualizarApartamento,
    excluirApartamento
} = require('../controllers/apartamentos.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get(
    '/',
    authMiddleware,
    listarApartamentos
);

router.get(
    '/:id',
    authMiddleware,
    buscarApartamento
);

router.post(
    '/',
    authMiddleware,
    criarApartamento
);

router.put(
    '/:id',
    authMiddleware,
    atualizarApartamento
);

router.delete(
    '/:id',
    authMiddleware,
    excluirApartamento
);

module.exports = router;