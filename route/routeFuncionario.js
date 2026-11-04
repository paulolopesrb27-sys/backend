const express = require('express');
const prisma = require('../database');

const router = express.Router();
const campos = ['nome', 'cargo', 'salario', 'telefone', 'email', 'data_admissao', 'ativo'];
const selecionarCampos = (body) => Object.fromEntries(
    campos.filter((campo) => Object.prototype.hasOwnProperty.call(body || {}, campo))
        .map((campo) => [campo, campo === 'data_admissao' && typeof body[campo] === 'string'
            ? new Date(body[campo])
            : body[campo]])
);

router.get('/', async (req, res) => {
    try {
        res.status(200).send({ funcionarios: await prisma.funcionario.findMany() });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const funcionario = await prisma.funcionario.findUnique({ where: { id_funcionario: Number(req.params.id) } });
        if (!funcionario) return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
        res.status(200).send({ funcionario });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.post('/', async (req, res) => {
    try {
        const funcionario = await prisma.funcionario.create({ data: selecionarCampos(req.body) });
        res.status(201).send({ mensagem: 'Funcionário criado com sucesso!', id_funcionario: funcionario.id_funcionario });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.patch('/:id', async (req, res) => {
    const data = selecionarCampos(req.body);
    if (Object.keys(data).length === 0) return res.status(400).send({ mensagem: 'Informe ao menos um campo para atualização.' });

    try {
        const resultado = await prisma.funcionario.updateMany({
            where: { id_funcionario: Number(req.params.id) },
            data
        });
        if (resultado.count === 0) return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
        res.status(202).send({ mensagem: 'Funcionário atualizado com sucesso!' });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const resultado = await prisma.funcionario.deleteMany({ where: { id_funcionario: Number(req.params.id) } });
        if (resultado.count === 0) return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
        res.status(202).send({ mensagem: 'Funcionário removido com sucesso!' });
    } catch (error) {
        res.status(500).send({ error });
    }
});

module.exports = router;