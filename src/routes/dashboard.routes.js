
const express = require('express');

const {
    obterDashboardMaster
} = require('../controllers/dashboard.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Consulta os indicadores do dashboard administrativo.
router.get(
    '/master',
    authMiddleware,
    obterDashboardMaster
);

module.exports = router;
