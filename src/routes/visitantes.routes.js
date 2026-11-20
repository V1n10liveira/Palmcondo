
const express = require('express');

const {
    listarVisitantes,
    buscarVisitante,
    criarVisitante
} = require('../controllers/visitantes.controller');

const {
    criarSolicitacaoPublica,
    criarConviteMorador,
    consultarSolicitacaoPublica,
    listarSolicitacoesMorador,
    responderSolicitacaoMorador
} = require('../controllers/solicitacoes.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Solicitação pública de acesso por visitante.
router.post('/solicitacoes', criarSolicitacaoPublica);

// Consulta pública de solicitação pelo token privado.
router.get(
    '/solicitacoes/publica/:token',
    consultarSolicitacaoPublica
);

// Cria convite de acesso autorizado pelo morador.
router.post(
    '/convites',
    authMiddleware,
    criarConviteMorador
);

// Lista solicitações do morador autenticado.
router.get(
    '/solicitacoes',
    authMiddleware,
    listarSolicitacoesMorador
);

// Aprova ou recusa uma solicitação de acesso.
router.patch(
    '/solicitacoes/:id/resposta',
    authMiddleware,
    responderSolicitacaoMorador
);

// Lista os visitantes vinculados ao morador autenticado.
router.get('/', authMiddleware, listarVisitantes);

// Busca um visitante pelo ID do vínculo.
router.get('/:id', authMiddleware, buscarVisitante);

// Cadastra ou reutiliza um visitante existente.
router.post('/', authMiddleware, criarVisitante);

module.exports = router;
