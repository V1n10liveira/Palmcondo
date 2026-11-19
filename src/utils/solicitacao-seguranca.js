
const crypto = require('crypto');

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TAMANHO_CODIGO = 6;

// Obtém uma chave hexadecimal de 32 bytes do .env.
function obterChave(nomeVariavel) {
    const valor = process.env[nomeVariavel];

    if (!valor || !/^[a-fA-F0-9]{64}$/.test(valor)) {
        throw new Error(
            `A variável ${nomeVariavel} deve conter uma chave hexadecimal de 64 caracteres.`
        );
    }

    return Buffer.from(valor, 'hex');
}

// Gera um token privado para acompanhamento.
function gerarTokenAcompanhamento() {
    return crypto.randomBytes(32).toString('base64url');
}

// Calcula o hash SHA-256 do token.
function gerarHashToken(token) {
    return crypto
        .createHash('sha256')
        .update(token, 'utf8')
        .digest('hex');
}

// Gera um código aleatório de seis caracteres.
function gerarCodigoLiberacao() {
    let codigo = '';

    for (let i = 0; i < TAMANHO_CODIGO; i++) {
        const indice = crypto.randomInt(0, ALFABETO_CODIGO.length);
        codigo += ALFABETO_CODIGO[indice];
    }

    return codigo;
}

// Gera HMAC-SHA-256 para proteger o código no banco.
function gerarHashCodigo(codigo) {
    const chave = obterChave('CODIGO_LIBERACAO_SECRET');

    return crypto
        .createHmac('sha256', chave)
        .update(codigo, 'utf8')
        .digest('hex');
}

// Criptografa o código usando AES-256-GCM.
function criptografarCodigo(codigo) {
    const chave = obterChave('CODIGO_LIBERACAO_SECRET');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        chave,
        iv
    );

    const criptografado = Buffer.concat([
        cipher.update(codigo, 'utf8'),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return [
        'v1',
        iv.toString('hex'),
        tag.toString('hex'),
        criptografado.toString('hex')
    ].join(':');
}

// Descriptografa um código armazenado no banco.
function descriptografarCodigo(valorCriptografado) {
    const chave = obterChave('CODIGO_LIBERACAO_SECRET');

    const partes = String(valorCriptografado).split(':');

    if (partes.length !== 4 || partes[0] !== 'v1') {
        throw new Error('Formato de código criptografado inválido.');
    }

    const [, ivHex, tagHex, conteudoHex] = partes;

    if (
        !/^[a-fA-F0-9]{24}$/.test(ivHex) ||
        !/^[a-fA-F0-9]{32}$/.test(tagHex) ||
        !/^[a-fA-F0-9]+$/.test(conteudoHex) ||
        conteudoHex.length % 2 !== 0
    ) {
        throw new Error('Dados de criptografia inválidos.');
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        chave,
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    const descriptografado = Buffer.concat([
        decipher.update(Buffer.from(conteudoHex, 'hex')),
        decipher.final()
    ]);

    return descriptografado.toString('utf8');
}

module.exports = {
    gerarTokenAcompanhamento,
    gerarHashToken,
    gerarCodigoLiberacao,
    gerarHashCodigo,
    criptografarCodigo,
    descriptografarCodigo
};
