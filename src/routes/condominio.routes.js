
const express = require('express');

const {
    buscarMeuCondominio,
    buscarCondominioPublico,
    listarApartamentosPublicos
} = require('../controllers/condominio.controller');

const authMiddleware = require('../middlewares/auth.middleware');

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

// Consulta os dados do condomínio autenticado.
router.get(
    '/me',
    authMiddleware,
    buscarMeuCondominio
);

module.exports = router;
