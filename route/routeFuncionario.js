const express = require('express');
const router = express.Router();
const mysql = require("../mysql").pool;

// 1. Endpoint GET - Listar Funcionários
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });
        conn.query("SELECT * FROM funcionarios", (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error });
            res.status(200).send({ funcionarios: resultado });
        });
    });
});

// 2. BUSCAR FUNCIONÁRIO POR ID
router.get('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query("SELECT * FROM funcionarios WHERE id_funcionario = ?", [req.params.id], (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error: error });
            if (resultado.length === 0) return res.status(404).send({ mensagem: "Funcionário não encontrado." });
            res.status(200).send({ funcionario: resultado[0] });
        });
    });
});

// 3. CADASTRAR FUNCIONÁRIO
router.post('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query(
            "INSERT INTO funcionarios (nome, cargo, salario, telefone, email, data_admissao, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                req.body.nome, 
                req.body.cargo, 
                req.body.salario, 
                req.body.telefone, 
                req.body.email, 
                req.body.data_admissao, 
                req.body.ativo
            ],
            (error, resultado) => {
                conn.release();
                if (error) return res.status(500).send({ error: error });
                res.status(201).send({
                    mensagem: "Funcionário criado com sucesso!",
                    id_funcionario: resultado.insertId
                });
            }
        );
    });
});

// 4. ATUALIZAR FUNCIONÁRIO
router.patch('/:id', (req, res, next) => {
    const camposPermitidos = ['nome', 'cargo', 'salario', 'telefone', 'email', 'data_admissao', 'ativo'];
    const campos = camposPermitidos.filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo));
    if (campos.length === 0) return res.status(400).send({ mensagem: "Informe ao menos um campo para atualização." });

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        const valores = campos.map((campo) => req.body[campo]);
        valores.push(req.params.id);
        conn.query(
            `UPDATE funcionarios SET ${campos.map((campo) => `${campo} = ?`).join(', ')} WHERE id_funcionario = ?`,
            valores,
            (error, resultado) => {
                conn.release();
                if (error) return res.status(500).send({ error: error });
                if (resultado.affectedRows === 0) return res.status(404).send({ mensagem: "Funcionário não encontrado." });
                res.status(202).send({ mensagem: "Funcionário atualizado com sucesso!" });
            }
        );
    });
});

// 5. REMOVER FUNCIONÁRIO
router.delete('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query("DELETE FROM funcionarios WHERE id_funcionario = ?", [req.params.id], (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error: error });
            if (resultado.affectedRows === 0) return res.status(404).send({ mensagem: "Funcionário não encontrado." });
            res.status(202).send({ mensagem: "Funcionário removido com sucesso!" });
        });
    });
});

module.exports = router;