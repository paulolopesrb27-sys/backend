const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('../mysql').pool;

const router = express.Router();
const senhaInvalida = { mensagem: 'E-mail ou senha inválidos.' };

router.post('/', (req, res) => {
    const { email, senha } = req.body || {};
    if (typeof email !== 'string' || typeof senha !== 'string' || !email || !senha) {
        return res.status(400).send({ mensagem: 'Informe e-mail e senha.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });
        conn.query(
            'SELECT id_usu, nome, email, contato, genero, ativo, criado_em, atualizado_em, senha FROM usuarios WHERE email = ? LIMIT 1',
            [email],
            async (queryError, resultado) => {
                if (queryError) {
                    conn.release();
                    return res.status(500).send({ error: queryError });
                }

                if (resultado.length === 0 || Number(resultado[0].ativo) !== 1) {
                    conn.release();
                    return res.status(401).send(senhaInvalida);
                }

                const usuario = resultado[0];
                const senhaArmazenada = usuario.senha;
                const bcryptValido = /^\$2[aby]\$/.test(senhaArmazenada);
                let autenticado = false;

                try {
                    if (bcryptValido) {
                        const hashCompatível = senhaArmazenada.replace(/^\$2y\$/, '$2b$');
                        autenticado = await bcrypt.compare(senha, hashCompatível);
                    } else {
                        autenticado = senha === senhaArmazenada;
                    }

                    if (!autenticado) {
                        conn.release();
                        return res.status(401).send(senhaInvalida);
                    }

                    if (!bcryptValido) {
                        const novoHash = await bcrypt.hash(senha, 10);
                        conn.query('UPDATE usuarios SET senha = ? WHERE id_usu = ?', [novoHash, usuario.id_usu], (updateError) => {
                            conn.release();
                            if (updateError) return res.status(500).send({ error: updateError });
                            delete usuario.senha;
                            res.status(200).send({ mensagem: 'Login realizado com sucesso.', usuario });
                        });
                        return;
                    }

                    conn.release();
                    delete usuario.senha;
                    res.status(200).send({ mensagem: 'Login realizado com sucesso.', usuario });
                } catch (compareError) {
                    conn.release();
                    res.status(500).send({ error: compareError });
                }
            }
        );
    });
});

module.exports = router;