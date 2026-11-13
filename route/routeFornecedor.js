const express = require('express');
const prisma = require('../database');

const router = express.Router();
const campos = ['nome', 'empresa', 'email', 'telefone', 'cidade', 'estado', 'ativo'];
const selecionarCampos = (body) => Object.fromEntries(
    campos.filter((campo) => Object.prototype.hasOwnProperty.call(body || {}, campo))
        .map((campo) => [campo, body[campo]])
);

router.get('/', async (req, res) => {
    try {
        res.status(200).send({ fornecedores: await prisma.fornecedor.findMany() });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const fornecedor = await prisma.fornecedor.findUnique({ where: { id_fornecedor: Number(req.params.id) } });
        if (!fornecedor) return res.status(404).send({ mensagem: 'Fornecedor não encontrado.' });
        res.status(200).send({ fornecedor });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.post('/', async (req, res) => {
    try {
        const fornecedor = await prisma.fornecedor.create({ data: selecionarCampos(req.body) });
        res.status(201).send({ mensagem: 'Fornecedor criado com sucesso!', id_fornecedor: fornecedor.id_fornecedor });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.patch('/:id', async (req, res) => {
    const data = selecionarCampos(req.body);
    if (Object.keys(data).length === 0) return res.status(400).send({ mensagem: 'Informe ao menos um campo para atualização.' });

    try {
        const resultado = await prisma.fornecedor.updateMany({
            where: { id_fornecedor: Number(req.params.id) },
            data
        });
        if (resultado.count === 0) return res.status(404).send({ mensagem: 'Fornecedor não encontrado.' });
        res.status(202).send({ mensagem: 'Fornecedor atualizado com sucesso!' });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const resultado = await prisma.fornecedor.deleteMany({ where: { id_fornecedor: Number(req.params.id) } });
        if (resultado.count === 0) return res.status(404).send({ mensagem: 'Fornecedor não encontrado.' });
        res.status(202).send({ mensagem: 'Fornecedor removido com sucesso!' });
    } catch (error) {
        res.status(500).send({ error });
    }
});

module.exports = router;