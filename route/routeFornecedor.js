const express = require('express');
const router = express.Router();
const mysql = require("../mysql").pool;

// 1. LISTAR TODOS OS FORNECEDORES
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error });
        conn.query("SELECT * FROM fornecedores", (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error });
            res.status(200).send({ fornecedores: resultado });
        });
    });
});

// 2. BUSCAR FORNECEDOR POR ID
router.get('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query("SELECT * FROM fornecedores WHERE id_fornecedor = ?", [req.params.id], (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error: error });
            if (resultado.length === 0) return res.status(404).send({ mensagem: "Fornecedor não encontrado." });
            res.status(200).send({ fornecedor: resultado[0] });
        });
    });
});

// 3. CADASTRAR FORNECEDOR
router.post('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query(
            `INSERT INTO fornecedores 
            (nome, empresa, email, telefone, cidade, estado, ativo, criado_em, atualizado_em) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                req.body.nome, 
                req.body.empresa, 
                req.body.email, 
                req.body.telefone, 
                req.body.cidade, 
                req.body.estado, 
                req.body.ativo
            ],
            (error, resultado) => {
                conn.release();
                if (error) return res.status(500).send({ error: error });
                res.status(201).send({
                    mensagem: "Fornecedor criado com sucesso!",
                    id_fornecedor: resultado.insertId
                });
            }
        );
    });
});

// 4. ATUALIZAR FORNECEDOR
router.patch('/:id', (req, res, next) => {
    const camposPermitidos = ['nome', 'empresa', 'email', 'telefone', 'cidade', 'estado', 'ativo'];
    const campos = camposPermitidos.filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo));
    if (campos.length === 0) return res.status(400).send({ mensagem: "Informe ao menos um campo para atualização." });

    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        const valores = campos.map((campo) => req.body[campo]);
        valores.push(req.params.id);
        conn.query(
            `UPDATE fornecedores SET ${campos.map((campo) => `${campo} = ?`).join(', ')} WHERE id_fornecedor = ?`,
            valores,
            (error, resultado) => {
                conn.release();
                if (error) return res.status(500).send({ error: error });
                if (resultado.affectedRows === 0) return res.status(404).send({ mensagem: "Fornecedor não encontrado." });
                res.status(202).send({ mensagem: "Fornecedor atualizado com sucesso!" });
            }
        );
    });
});

// 5. REMOVER FORNECEDOR
router.delete('/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) return res.status(500).send({ error: error });
        conn.query("DELETE FROM fornecedores WHERE id_fornecedor = ?", [req.params.id], (error, resultado) => {
            conn.release();
            if (error) return res.status(500).send({ error: error });
            if (resultado.affectedRows === 0) return res.status(404).send({ mensagem: "Fornecedor não encontrado." });
            res.status(202).send({ mensagem: "Fornecedor removido com sucesso!" });
        });
    });
});

module.exports = router;