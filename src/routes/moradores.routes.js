
const express = require('express');

const {
    consultarMeusDados,
    listarMoradores,
    buscarMorador,
    criarMorador,
    atualizarMorador,
    excluirMorador
} = require('../controllers/moradores.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const permitirPerfis = require('../middlewares/permissao.middleware');

const router = express.Router();

// Consultar os próprios dados
// Disponível para o MORADOR autenticado
router.get(
    '/me',
    authMiddleware,
    permitirPerfis('MORADOR'),
    consultarMeusDados
);

// Listar moradores
router.get(
    '/',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    listarMoradores
);

// Buscar morador por ID
router.get(
    '/:id',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    buscarMorador
);

// Cadastrar morador
router.post(
    '/',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    criarMorador
);

// Atualizar morador
router.put(
    '/:id',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    atualizarMorador
);

// Desativar morador
router.delete(
    '/:id',
    authMiddleware,
    permitirPerfis('MASTER', 'SINDICO'),
    excluirMorador
);

module.exports = router;
