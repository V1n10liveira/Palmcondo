
const express = require('express');

const {
    criarCondominioMaster,
    listarCondominiosMaster,
    buscarMeuCondominio,
    buscarCondominioPublico,
    listarApartamentosPublicos
} = require('../controllers/condominio.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const permitirPerfis = require('../middlewares/permissao.middleware');

const router = express.Router();

// Consulta pública dos apartamentos pelo código do condomínio.
router.get(
    '/publico/:codigo/apartamentos',
    listarApartamentosPublicos
);

// Consulta pública pelo código do condomínio.
router.get(
    '/publico/:codigo',
    buscarCondominioPublico
);

// Lista todos os condomínios (acesso exclusivo MASTER).
router.get(
    '/',
    authMiddleware,
    permitirPerfis('MASTER'),
    listarCondominiosMaster
);

// Cadastra um condomínio (acesso exclusivo MASTER).
router.post(
    '/',
    authMiddleware,
    permitirPerfis('MASTER'),
    criarCondominioMaster
);

// Consulta os dados do condomínio autenticado.
router.get(
    '/me',
    authMiddleware,
    buscarMeuCondominio
);

module.exports = router;
