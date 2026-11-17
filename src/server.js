
require('dotenv').config();

const app = require('./app');
const { iniciarServicoExpiracao } = require('./services/expiracao.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Palmcondo API rodando na porta ${PORT}`);

    iniciarServicoExpiracao();
});
