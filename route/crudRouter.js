const express = require('express');
const prisma = require('../database');

function ajustarEstoque(tx, tabela, movimentacao, direcao) {
    const sinal = tabela === 'entradas' ? direcao : -direcao;
    const quantidade = Number(movimentacao.quantidade) * sinal;

    if (tabela === 'entradas' && direcao === 1) {
        return tx.estoque.upsert({
            where: { id_produto: movimentacao.id_produto },
            create: { id_produto: movimentacao.id_produto, quantidade },
            update: { quantidade: { increment: quantidade } }
        });
    }

    return tx.estoque.updateMany({
        where: { id_produto: movimentacao.id_produto },
        data: { quantidade: { increment: quantidade } }
    });
}

function criarCrudRouter(configuracao) {
    const router = express.Router();
    const { tabela, chave, modelo, campos, obrigatorios = [], movimentaEstoque = false } = configuracao;
    const camposData = new Set(['data_entrada', 'data_saida', 'data_pedido', 'vigencia', 'data_movimentacao', 'data_hora']);
    const obterId = (req) => Number(req.params.id);
    const obterDados = (body, permitidos) => Object.fromEntries(
        permitidos
            .filter((campo) => Object.prototype.hasOwnProperty.call(body || {}, campo))
            .map((campo) => [campo, camposData.has(campo) && typeof body[campo] === 'string'
                ? new Date(body[campo])
                : body[campo]])
    );

    router.get('/', async (req, res) => {
        try {
            const resultado = await prisma[modelo].findMany();
            res.status(200).send({ [tabela]: resultado });
        } catch (error) {
            res.status(500).send({ error });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const registro = await prisma[modelo].findUnique({ where: { [chave]: obterId(req) } });
            if (!registro) return res.status(404).send({ mensagem: 'Registro não encontrado.' });
            res.status(200).send({ [tabela]: registro });
        } catch (error) {
            res.status(500).send({ error });
        }
    });

    router.post('/', async (req, res) => {
        const dados = obterDados(req.body, campos);
        if (Object.keys(dados).length === 0) return res.status(400).send({ mensagem: 'Informe os campos do registro.' });
        const ausentes = obrigatorios.filter((campo) => !Object.prototype.hasOwnProperty.call(req.body || {}, campo));
        if (ausentes.length > 0) return res.status(400).send({ mensagem: `Campos obrigatórios: ${ausentes.join(', ')}.` });

        try {
            const registro = await prisma[modelo].create({ data: dados });
            res.status(201).send({ mensagem: 'Registro criado com sucesso.', [chave]: registro[chave] });
        } catch (error) {
            res.status(500).send({ error });
        }
    });

    router.patch('/:id', async (req, res) => {
        const dados = obterDados(req.body, campos);
        if (Object.keys(dados).length === 0) return res.status(400).send({ mensagem: 'Informe ao menos um campo para atualização.' });

        try {
            const atualizado = await prisma.$transaction(async (tx) => {
                const registro = await tx[modelo].findUnique({ where: { [chave]: obterId(req) } });
                if (!registro) return false;

                if (movimentaEstoque) {
                    const anterior = { id_produto: registro.id_produto, quantidade: registro.quantidade };
                    const novo = { ...anterior, ...dados };
                    await ajustarEstoque(tx, tabela, anterior, -1);
                    await tx[modelo].update({ where: { [chave]: obterId(req) }, data: dados });
                    await ajustarEstoque(tx, tabela, novo, 1);
                } else {
                    await tx[modelo].update({ where: { [chave]: obterId(req) }, data: dados });
                }
                return true;
            }, { isolationLevel: 'Serializable' });

            if (!atualizado) return res.status(404).send({ mensagem: 'Registro não encontrado.' });
            res.status(200).send({ mensagem: 'Registro atualizado com sucesso.' });
        } catch (error) {
            res.status(500).send({ error });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const removido = await prisma.$transaction(async (tx) => {
                const registro = await tx[modelo].findUnique({ where: { [chave]: obterId(req) } });
                if (!registro) return false;
                if (movimentaEstoque) await ajustarEstoque(tx, tabela, registro, -1);
                await tx[modelo].delete({ where: { [chave]: obterId(req) } });
                return true;
            }, { isolationLevel: 'Serializable' });

            if (!removido) return res.status(404).send({ mensagem: 'Registro não encontrado.' });
            res.status(200).send({ mensagem: 'Registro removido com sucesso.' });
        } catch (error) {
            res.status(500).send({ error });
        }
    });

    return router;
}

module.exports = criarCrudRouter;