
const express = require('express');

const {
    listarPrestadores,
    buscarPrestador,
    criarPrestador
} = require('../controllers/prestadores.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Lista os prestadores ativos do condomínio.
router.get('/', authMiddleware, listarPrestadores);

// Busca um prestador pelo ID.
router.get('/:id', authMiddleware, buscarPrestador);

// Cadastra ou reutiliza um prestador existente.
router.post('/', authMiddleware, criarPrestador);

module.exports = router;
