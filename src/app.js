
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const condominioRoutes = require('./routes/condominio.routes');
const apartamentosRoutes = require('./routes/apartamentos.routes');
const moradoresRoutes = require('./routes/moradores.routes');
const autorizacoesRoutes = require('./routes/autorizacoes.routes');
const prestadoresRoutes = require('./routes/prestadores.routes');
const visitantesRoutes = require('./routes/visitantes.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificacoesRoutes = require('./routes/notificacoes.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        sistema: 'Palmcondo',
        status: 'online'
    });
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/condominios', condominioRoutes);
app.use('/apartamentos', apartamentosRoutes);
app.use('/moradores', moradoresRoutes);
app.use('/autorizacoes', autorizacoesRoutes);
app.use('/prestadores', prestadoresRoutes);
app.use('/visitantes', visitantesRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notificacoes', notificacoesRoutes);

module.exports = app;
