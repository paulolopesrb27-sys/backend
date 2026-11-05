const express = require('express');
const PDFDocument = require('pdfkit');
const prisma = require('../../database');

const router = express.Router();
const includePedido = {
  pedido: {
    include: {
      cliente: { select: { nome: true } },
      itens: { include: { produto: true } }
    }
  }
};

function formatarEntrega(registro) {
  const pedido = registro.pedido;
  return {
    id: registro.id_rastreamento,
    codigo_rastreio: registro.codigo_rastreio,
    destinatario_nome: registro.destinatario_nome || pedido.cliente?.nome || 'Cliente não informado',
    status: registro.status,
    endereco: registro.endereco,
    bairro: registro.bairro,
    cidade: registro.cidade,
    estado: registro.estado,
    ultima_atualizacao: registro.atualizado_em,
    pedido: {
      id_pedido: pedido.id_pedido,
      data_pedido: pedido.data_pedido,
      status: pedido.status
    },
    produtos: pedido.itens.map((item) => ({
      id_produto: item.produto?.id_produto,
      nome: item.produto?.nome || item.produto?.descricao || 'Produto não informado',
      quantidade: item.quantidade || 0,
      valor_unitario: item.valor_unitario,
      subtotal: item.subtotal
    })),
    historicos: [{
      status: registro.status,
      data_hora: registro.atualizado_em,
      localizacao: `Pedido #${pedido.id_pedido}`,
      observacao: 'Acompanhe o status do pedido e os produtos cadastrados.'
    }]
  };
}

router.get('/', async (req, res) => {
  try {
    const registros = await prisma.rastreamento.findMany({
      include: includePedido,
      orderBy: { id_rastreamento: 'asc' }
    });
    res.json(registros.map(formatarEntrega));
  } catch (error) {
    console.error('Falha ao listar rastreamentos:', error.message);
    res.status(503).json({ error: 'Não foi possível consultar os rastreamentos no banco de dados.' });
  }
});

router.get('/:codigo/comprovante', async (req, res) => {
  try {
    const registro = await prisma.rastreamento.findUnique({
      where: { codigo_rastreio: req.params.codigo.trim().toUpperCase() },
      include: includePedido
    });
    if (!registro) return res.status(404).send('Código de rastreio não encontrado.');

    const entrega = formatarEntrega(registro);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=rastreio_${entrega.codigo_rastreio}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).fillColor('#1E3A8A').text('COMPROVANTE DE RASTREIO');
    doc.moveDown();
    doc.fontSize(11).fillColor('#0F172A');
    doc.text(`Código: ${entrega.codigo_rastreio}`);
    doc.text(`Destinatário: ${entrega.destinatario_nome}`);
    doc.text(`Pedido: #${entrega.pedido.id_pedido}`);
    doc.text(`Status: ${entrega.status}`);
    doc.text(`Endereço: ${entrega.endereco}, ${entrega.bairro} - ${entrega.cidade}/${entrega.estado}`);
    doc.moveDown().fontSize(13).text('Produtos do pedido');
    if (entrega.produtos.length === 0) {
      doc.fontSize(10).text('Nenhum item de produto foi cadastrado neste pedido.');
    } else {
      entrega.produtos.forEach((produto) => {
        doc.fontSize(10).text(`${produto.nome} | Quantidade: ${produto.quantidade}`);
      });
    }
    doc.end();
  } catch (error) {
    console.error('Falha ao gerar comprovante:', error.message);
    res.status(503).send('Não foi possível gerar o comprovante.');
  }
});

router.get('/:codigo', async (req, res) => {
  try {
    const registro = await prisma.rastreamento.findUnique({
      where: { codigo_rastreio: req.params.codigo.trim().toUpperCase() },
      include: includePedido
    });
    if (!registro) return res.status(404).json({ error: 'Código de rastreio não encontrado.' });
    res.json(formatarEntrega(registro));
  } catch (error) {
    console.error('Falha ao consultar rastreamento:', error.message);
    res.status(503).json({ error: 'Não foi possível consultar o rastreamento no banco de dados.' });
  }
});

module.exports = router;