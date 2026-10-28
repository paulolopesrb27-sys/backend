const express = require('express');
const mysql = require('../mysql').pool;

function executarQuery(conn, sql, valores = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, valores, (error, resultado) => {
            if (error) return reject(error);
            resolve(resultado);
        });
    });
}

function executarTransacao(conn, executar) {
    return new Promise((resolve, reject) => {
        conn.beginTransaction((error) => {
            if (error) return reject(error);
            Promise.resolve()
                .then(executar)
                .then((resultado) => conn.commit((commitError) => {
                    if (commitError) return conn.rollback(() => reject(commitError));
                    resolve(resultado);
                }))
                .catch((queryError) => conn.rollback(() => reject(queryError)));
        });
    });
}

function ajustarEstoque(conn, tabela, movimentacao, direcao) {
    const sinal = tabela === 'entradas' ? direcao : -direcao;
    const quantidade = Number(movimentacao.quantidade) * sinal;

    if (tabela === 'entradas' && direcao === 1) {
        return executarQuery(
            conn,
            'INSERT INTO estoque (id_produto, quantidade) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)',
            [movimentacao.id_produto, quantidade]
        );
    }

    return executarQuery(
        conn,
        'UPDATE estoque SET quantidade = quantidade + ? WHERE id_produto = ?',
        [quantidade, movimentacao.id_produto]
    );
}

function criarCrudRouter(configuracao) {
    const router = express.Router();
    const { tabela, chave, campos, obrigatorios = [], movimentaEstoque = false } = configuracao;

    router.get('/', (req, res) => {
        mysql.getConnection((error, conn) => {
            if (error) return res.status(500).send({ error });
            conn.query(`SELECT * FROM ${tabela}`, (queryError, resultado) => {
                conn.release();
                if (queryError) return res.status(500).send({ error: queryError });
                res.status(200).send({ [tabela]: resultado });
            });
        });
    });

    router.get('/:id', (req, res) => {
        mysql.getConnection((error, conn) => {
            if (error) return res.status(500).send({ error });
            conn.query(`SELECT * FROM ${tabela} WHERE ${chave} = ?`, [req.params.id], (queryError, resultado) => {
                conn.release();
                if (queryError) return res.status(500).send({ error: queryError });
                if (resultado.length === 0) return res.status(404).send({ mensagem: 'Registro não encontrado.' });
                res.status(200).send({ [tabela]: resultado[0] });
            });
        });
    });

    router.post('/', (req, res) => {
        const colunas = campos.filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo));
        if (colunas.length === 0) return res.status(400).send({ mensagem: 'Informe os campos do registro.' });
        const ausentes = obrigatorios.filter((campo) => !Object.prototype.hasOwnProperty.call(req.body, campo));
        if (ausentes.length > 0) return res.status(400).send({ mensagem: `Campos obrigatórios: ${ausentes.join(', ')}.` });

        const valores = colunas.map((campo) => req.body[campo]);
        mysql.getConnection((error, conn) => {
            if (error) return res.status(500).send({ error });
            conn.query(
                `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${colunas.map(() => '?').join(', ')})`,
                valores,
                (queryError, resultado) => {
                    conn.release();
                    if (queryError) return res.status(500).send({ error: queryError });
                    res.status(201).send({ mensagem: 'Registro criado com sucesso.', [chave]: resultado.insertId });
                }
            );
        });
    });

    router.patch('/:id', (req, res) => {
        const atualizaveis = campos.filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo));
        if (atualizaveis.length === 0) return res.status(400).send({ mensagem: 'Informe ao menos um campo para atualização.' });

        const valores = atualizaveis.map((campo) => req.body[campo]);
        valores.push(req.params.id);
        const atualizacoes = atualizaveis.map((campo) => `${campo} = ?`).join(', ');

        mysql.getConnection((error, conn) => {
            if (error) return res.status(500).send({ error });

            const atualizar = async () => {
                if (!movimentaEstoque) {
                    const resultado = await executarQuery(conn, `UPDATE ${tabela} SET ${atualizacoes} WHERE ${chave} = ?`, valores);
                    return resultado.affectedRows > 0;
                }

                return executarTransacao(conn, async () => {
                    const registros = await executarQuery(
                        conn,
                        `SELECT id_produto, quantidade FROM ${tabela} WHERE ${chave} = ? FOR UPDATE`,
                        [req.params.id]
                    );
                    if (registros.length === 0) return false;

                    const anterior = registros[0];
                    const atualizado = { ...anterior, ...req.body };
                    await ajustarEstoque(conn, tabela, anterior, -1);
                    await executarQuery(conn, `UPDATE ${tabela} SET ${atualizacoes} WHERE ${chave} = ?`, valores);
                    await ajustarEstoque(conn, tabela, atualizado, 1);
                    return true;
                });
            };

            atualizar()
                .then((atualizado) => {
                    conn.release();
                    if (!atualizado) return res.status(404).send({ mensagem: 'Registro não encontrado.' });
                    res.status(200).send({ mensagem: 'Registro atualizado com sucesso.' });
                })
                .catch((queryError) => {
                    conn.release();
                    res.status(500).send({ error: queryError });
                });
        });
    });

    router.delete('/:id', (req, res) => {
        mysql.getConnection((error, conn) => {
            if (error) return res.status(500).send({ error });

            const remover = async () => {
                if (!movimentaEstoque) {
                    const resultado = await executarQuery(conn, `DELETE FROM ${tabela} WHERE ${chave} = ?`, [req.params.id]);
                    return resultado.affectedRows > 0;
                }

                return executarTransacao(conn, async () => {
                    const registros = await executarQuery(
                        conn,
                        `SELECT id_produto, quantidade FROM ${tabela} WHERE ${chave} = ? FOR UPDATE`,
                        [req.params.id]
                    );
                    if (registros.length === 0) return false;

                    await ajustarEstoque(conn, tabela, registros[0], -1);
                    await executarQuery(conn, `DELETE FROM ${tabela} WHERE ${chave} = ?`, [req.params.id]);
                    return true;
                });
            };

            remover()
                .then((removido) => {
                    conn.release();
                    if (!removido) return res.status(404).send({ mensagem: 'Registro não encontrado.' });
                    res.status(200).send({ mensagem: 'Registro removido com sucesso.' });
                })
                .catch((queryError) => {
                    conn.release();
                    res.status(500).send({ error: queryError });
                });
        });
    });

    return router;
}

module.exports = criarCrudRouter;