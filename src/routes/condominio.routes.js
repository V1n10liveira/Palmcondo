const express = require('express');

const {
    buscarMeuCondominio
} = require('../controllers/condominio.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get(
    '/me',
    authMiddleware,
    buscarMeuCondominio
);

module.exports = router;