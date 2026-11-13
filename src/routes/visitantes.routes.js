
const express = require('express');

const {
    listarVisitantes,
    buscarVisitante,
    criarVisitante
} = require('../controllers/visitantes.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Lista os visitantes vinculados ao morador autenticado.
router.get('/', authMiddleware, listarVisitantes);

// Busca um visitante pelo ID do vínculo.
router.get('/:id', authMiddleware, buscarVisitante);

// Cadastra ou reutiliza um visitante existente.
router.post('/', authMiddleware, criarVisitante);

module.exports = router;
