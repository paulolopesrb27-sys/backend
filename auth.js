const jwt = require('jsonwebtoken');

const localSecret = 'loja-api-local-development-secret-only';

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret.length >= 32 ? secret : null;
    return process.env.NODE_ENV === 'production' ? null : localSecret;
}

function createToken(usuario) {
    const secret = getSecret();
    if (!secret) throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres.');
    return jwt.sign({ email: usuario.email }, secret, {
        subject: String(usuario.id_usu),
        expiresIn: '8h'
    });
}

function requireAuthentication(req, res, next) {
    if (req.method === 'OPTIONS') return next();

    const secret = getSecret();
    if (!secret) {
        return res.status(503).send({ mensagem: 'A autenticação não está configurada corretamente.' });
    }

    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).send({ mensagem: 'Autenticação necessária.' });

    try {
        req.usuario = jwt.verify(match[1], secret);
        return next();
    } catch {
        return res.status(401).send({ mensagem: 'Sessão inválida ou expirada.' });
    }
}

module.exports = { createToken, requireAuthentication };