const express = require('express');
const bcrypt = require('bcryptjs');
const { createToken } = require('../auth');
const prisma = require('../database');

const router = express.Router();
const senhaInvalida = { mensagem: 'E-mail ou senha inválidos.' };

router.post('/', async (req, res) => {
    const { email, senha } = req.body || {};
    if (typeof email !== 'string' || typeof senha !== 'string' || !email || !senha) {
        return res.status(400).send({ mensagem: 'Informe e-mail e senha.' });
    }

    try {
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario || Number(usuario.ativo) !== 1) return res.status(401).send(senhaInvalida);

        const senhaArmazenada = usuario.senha;
        const bcryptValido = /^\$2[aby]\$/.test(senhaArmazenada);
        const hashCompatível = senhaArmazenada.replace(/^\$2y\$/, '$2b$');
        const autenticado = bcryptValido
            ? await bcrypt.compare(senha, hashCompatível)
            : senha === senhaArmazenada;
        if (!autenticado) return res.status(401).send(senhaInvalida);

        if (!bcryptValido) {
            const novoHash = await bcrypt.hash(senha, 10);
            await prisma.usuario.update({ where: { id_usu: usuario.id_usu }, data: { senha: novoHash } });
        }

        delete usuario.senha;
        try {
            res.status(200).send({
                mensagem: 'Login realizado com sucesso.',
                usuario,
                token: createToken(usuario)
            });
        } catch (tokenError) {
            res.status(503).send({ mensagem: tokenError.message });
        }
    } catch (error) {
        res.status(500).send({ error });
    }
});

module.exports = router;