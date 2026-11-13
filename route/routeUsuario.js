const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../database');

const router = express.Router();
const camposPublicos = {
    id_usu: true,
    nome: true,
    email: true,
    contato: true,
    genero: true,
    ativo: true,
    criado_em: true,
    atualizado_em: true
};
const camposPermitidos = ['nome', 'email', 'senha', 'contato', 'genero', 'ativo'];

router.get('/', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({ select: camposPublicos });
        res.status(200).send({ usuarios });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id_usu: Number(req.params.id) },
            select: camposPublicos
        });
        if (!usuario) return res.status(404).send({ mensagem: 'Usuário não encontrado.' });
        res.status(200).send({ usuario });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.post('/', async (req, res) => {
    if (typeof req.body?.senha !== 'string' || !req.body.senha) {
        return res.status(400).send({ mensagem: 'Informe uma senha válida.' });
    }

    try {
        const senha = await bcrypt.hash(req.body.senha, 10);
        const dados = Object.fromEntries(
            camposPermitidos.filter((campo) => campo !== 'senha' && Object.prototype.hasOwnProperty.call(req.body, campo))
                .map((campo) => [campo, req.body[campo]])
        );
        const usuario = await prisma.usuario.create({ data: { ...dados, senha } });
        res.status(201).send({ mensagem: 'Usuário criado com sucesso!', id_usuario: usuario.id_usu });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.patch('/:id', async (req, res) => {
    const campos = camposPermitidos.filter((campo) => Object.prototype.hasOwnProperty.call(req.body || {}, campo));
    if (campos.length === 0) return res.status(400).send({ mensagem: 'Informe ao menos um campo para atualização.' });

    const dados = Object.fromEntries(campos.filter((campo) => campo !== 'senha').map((campo) => [campo, req.body[campo]]));
    if (campos.includes('senha')) {
        if (typeof req.body.senha !== 'string' || !req.body.senha) {
            return res.status(400).send({ mensagem: 'Informe uma senha válida.' });
        }
        try {
            dados.senha = await bcrypt.hash(req.body.senha, 10);
        } catch (error) {
            return res.status(500).send({ error });
        }
    }

    try {
        const resultado = await prisma.usuario.updateMany({
            where: { id_usu: Number(req.params.id) },
            data: dados
        });
        if (resultado.count === 0) return res.status(404).send({ mensagem: 'Usuário não encontrado.' });
        res.status(202).send({ mensagem: 'Usuário atualizado com sucesso!' });
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const resultado = await prisma.usuario.deleteMany({ where: { id_usu: Number(req.params.id) } });
        if (resultado.count === 0) return res.status(404).send({ mensagem: 'Usuário não encontrado.' });
        res.status(202).send({ mensagem: 'Usuário removido com sucesso!' });
    } catch (error) {
        res.status(500).send({ error });
    }
});

module.exports = router;