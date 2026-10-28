const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const mysql = require("../mysql").pool;

// Listar usuários sem expor a senha armazenada.
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });
        conn.query("SELECT id_usu, nome, email, contato, genero, ativo, criado_em, atualizado_em FROM usuarios", (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error });
            res.status(200).send({ usuarios: resultado });
        });
    });
});

router.get('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query("SELECT id_usu, nome, email, contato, genero, ativo, criado_em, atualizado_em FROM usuarios WHERE id_usu = ?", [req.params.id], (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error: error });
            if (resultado.length === 0) return res.status(404).send({ mensagem: "Usuário não encontrado." });
            res.status(200).send({ usuario: resultado[0] });
        });
    });
});



// CADASTRAR USUÁRIO
router.post('/', async (req, res, next) => {
    if (typeof req.body.senha !== 'string' || !req.body.senha) {
        return res.status(400).send({ mensagem: "Informe uma senha válida." });
    }

    let senhaHash;
    try {
        senhaHash = await bcrypt.hash(req.body.senha, 10);
    } catch (error) {
        return res.status(500).send({ error });
    }

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query(
            "INSERT INTO usuarios (nome, email, senha, contato, genero, ativo) VALUES (?, ?, ?, ?, ?, ?)",
            [req.body.nome, req.body.email, senhaHash, req.body.contato, req.body.genero, req.body.ativo],
            (error, resultado) => {
                conn.release();
                if (error) return res.status(500).send({ error: error });
                res.status(201).send({
                    mensagem: "Usuário criado com sucesso!",
                    id_usuario: resultado.insertId
                });
            }
        );
    });
});




// ATUALIZAR USUÁRIO
router.patch('/:id', async (req, res, next) => {
    const camposPermitidos = ['nome', 'email', 'senha', 'contato', 'genero', 'ativo'];
    const campos = camposPermitidos.filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo));
    if (campos.length === 0) return res.status(400).send({ mensagem: "Informe ao menos um campo para atualização." });

    const valores = campos.map((campo) => req.body[campo]);
    const indiceSenha = campos.indexOf('senha');
    if (indiceSenha !== -1) {
        if (typeof req.body.senha !== 'string' || !req.body.senha) {
            return res.status(400).send({ mensagem: "Informe uma senha válida." });
        }
        try {
            valores[indiceSenha] = await bcrypt.hash(req.body.senha, 10);
        } catch (error) {
            return res.status(500).send({ error });
        }
    }

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        valores.push(req.params.id);
        conn.query(
            `UPDATE usuarios SET ${campos.map((campo) => `${campo} = ?`).join(', ')} WHERE id_usu = ?`,
            valores,
            (error, resultado) => {
                conn.release();
                if (error) return res.status(500).send({ error: error });
                if (resultado.affectedRows === 0) return res.status(404).send({ mensagem: "Usuário não encontrado." });
                res.status(202).send({ mensagem: "Usuário atualizado com sucesso!" });
            }
        );
    });
});








// REMOVER USUÁRIO
router.delete('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query("DELETE FROM usuarios WHERE id_usu = ?", [req.params.id], (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error: error });
            if (resultado.affectedRows === 0) return res.status(404).send({ mensagem: "Usuário não encontrado." });
            res.status(202).send({ mensagem: "Usuário removido com sucesso!" });
        });
    });
});
















module.exports = router;
// Solicita uma conexão ao pool, executa a query SQL, libera a conexão para o pool imediatamente após a resposta e trata possíveis erros de execução.



