/**
 * Servidor Node.js (Express) - Sistema de Rastreio Incrível do Paulo
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');
const trackingRouter = require('./trackingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve a pasta com o frontend e mapa Leaflet
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/entregas', trackingRouter);

// Base de dados de encomendas
const entregas = {
  "PAULOMRSENAI67": {
    id: 1,
    codigo_rastreio: "PAULOMRSENAI67",
    destinatario_nome: "Beatriz Freitas Soares",
    destinatario_documento: "482.910.351-88",
    status: "Saiu para entrega",
    endereco: "Rua 13 de Julho - Bairro Neblina",
    cidade: "Araguaína",
    estado: "TO",
    latitude: -7.1850,
    longitude: -48.2165,
    ultima_atualizacao: new Date().toISOString(),
    historicos: [
      {
        status: "Saiu para entrega",
        data_hora: new Date(Date.now() - 15 * 60000).toISOString(),
        localizacao: "Centro de Distribuição Araguaína / TO",
        observacao: "Motorista Paulo a caminho da Rua 13 de Julho, Bairro Neblina"
      },
      {
        status: "Em trânsito",
        data_hora: new Date(Date.now() - 3 * 3600000).toISOString(),
        localizacao: "Unidade de Distribuição Araguaína / TO",
        observacao: "Objeto recebido para entrega final a Beatriz Freitas Soares"
      },
      {
        status: "Em trânsito",
        data_hora: new Date(Date.now() - 24 * 3600000).toISOString(),
        localizacao: "Hub Operacional Palmas / TO",
        observacao: "Encaminhado para a unidade regional de Araguaína"
      },
      {
        status: "Postado",
        data_hora: new Date(Date.now() - 48 * 3600000).toISOString(),
        localizacao: "Agência Central Paulo Express Palmas / TO",
        observacao: "Postagem confirmada no Sistema Incrível do Paulo"
      }
    ]
  },
  "BR123456789": {
    id: 2,
    codigo_rastreio: "BR123456789",
    destinatario_nome: "Carlos Eduardo Silva",
    destinatario_documento: "123.456.789-00",
    status: "Em trânsito",
    endereco: "Av. Paulista, 1578 - Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    latitude: -23.561684,
    longitude: -46.655981,
    ultima_atualizacao: new Date().toISOString(),
    historicos: [
      {
        status: "Em trânsito",
        data_hora: new Date().toISOString(),
        localizacao: "Centro de Distribuição São Paulo / SP",
        observacao: "Carga transferida para o veículo de entrega local"
      }
    ]
  },
  "BR987654321": {
    id: 3,
    codigo_rastreio: "BR987654321",
    destinatario_nome: "Mariana Costa Oliveira",
    destinatario_documento: "987.654.321-11",
    status: "Entregue",
    endereco: "Av. Atlântica, 1702 - Copacabana",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    latitude: -22.971974,
    longitude: -43.184300,
    ultima_atualizacao: new Date().toISOString(),
    historicos: [
      {
        status: "Entregue",
        data_hora: new Date().toISOString(),
        localizacao: "Rio de Janeiro / RJ",
        observacao: "Entregue com sucesso"
      }
    ]
  }
};

// ==========================================
// Rotas da API
// ==========================================

// Listar todas as encomendas
app.get('/api/entregas', (req, res) => {
  res.json(Object.values(entregas));
});

// Consultar entrega por código de rastreio
app.get('/api/entregas/:codigo', (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  const entrega = entregas[codigo];

  if (!entrega) {
    return res.status(404).json({ error: `Encomenda "${codigo}" não encontrada.` });
  }

  res.json(entrega);
});

// Gerar comprovante oficial em PDF via PDFKit
app.get('/api/entregas/:codigo/comprovante', (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  const entrega = entregas[codigo];

  if (!entrega) {
    return res.status(404).send('Encomenda não encontrada para emissão de comprovante.');
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=comprovante_${codigo}.pdf`);
  doc.pipe(res);

  // Barra azul superior
  doc.rect(0, 0, 612, 10).fill('#1E3A8A');

  // Cabeçalho da Empresa
  doc.fontSize(18).fillColor('#1E3A8A').text('RASTREIO INCRÍVEL DO PAULO', 40, 30);
  doc.fontSize(10).fillColor('#64748B').text('COMPROVANTE OFICIAL DE ENTREGA', 40, 35, { align: 'right' });
  doc.moveTo(40, 55).lineTo(570, 55).strokeColor('#E2E8F0').stroke();

  // Caixa de Destaque
  doc.rect(40, 65, 530, 55).fillAndStroke('#F8FAFC', '#CBD5E1');
  doc.fillColor('#475569').fontSize(10).text('CÓDIGO DE RASTREIO:', 55, 75);
  doc.fillColor('#0F172A').fontSize(15).text(entrega.codigo_rastreio, 180, 73);

  doc.fillColor('#475569').fontSize(10).text('STATUS:', 370, 75);
  doc.fillColor('#1E40AF').fontSize(12).text(entrega.status.toUpperCase(), 430, 74);

  doc.fillColor('#64748B').fontSize(9).text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 55, 100);

  // Seção 1: Dados do Destinatário
  doc.moveDown(3);
  doc.fontSize(12).fillColor('#1E3A8A').text('1. DADOS DO DESTINATÁRIO E ENTREGA', 40, 135);
  doc.moveTo(40, 150).lineTo(570, 150).strokeColor('#1E3A8A').lineWidth(0.5).stroke();

  doc.fontSize(10).fillColor('#334155');
  doc.text(`Destinatário: ${entrega.destinatario_nome}`, 40, 160);
  doc.text(`Documento / CPF: ${entrega.destinatario_documento || 'Não informado'}`, 350, 160);
  doc.text(`Endereço: ${entrega.endereco}`, 40, 180);
  doc.text(`Cidade / UF: ${entrega.cidade} - ${entrega.estado}`, 40, 200);
  doc.text(`Coordenadas: ${entrega.latitude}, ${entrega.longitude}`, 350, 200);

  // Seção 2: Linha do Tempo
  doc.fontSize(12).fillColor('#1E3A8A').text('2. HISTÓRICO DE MOVIMENTAÇÕES', 40, 230);
  doc.moveTo(40, 245).lineTo(570, 245).strokeColor('#1E3A8A').lineWidth(0.5).stroke();

  let yPos = 255;
  entrega.historicos.forEach(h => {
    doc.fontSize(9).fillColor('#0F172A').text(`• ${h.status} - ${h.localizacao}`, 45, yPos);
    doc.fontSize(8).fillColor('#64748B').text(`${new Date(h.data_hora).toLocaleString('pt-BR')} | ${h.observacao || ''}`, 55, yPos + 12);
    yPos += 30;
  });

  // Seção 3: Assinatura
  doc.fontSize(12).fillColor('#1E3A8A').text('3. TERMO DE RECEBIMENTO', 40, yPos + 15);
  doc.moveTo(40, yPos + 30).lineTo(570, yPos + 30).strokeColor('#1E3A8A').lineWidth(0.5).stroke();

  doc.fontSize(9).fillColor('#64748B').text(
    'Declaro que recebi o objeto correspondente a este código de rastreio em perfeitas condições.',
    40, yPos + 38
  );

  const ySign = yPos + 100;
  doc.moveTo(50, ySign).lineTo(300, ySign).strokeColor('#64748B').stroke();
  doc.moveTo(350, ySign).lineTo(530, ySign).strokeColor('#64748B').stroke();

  doc.fontSize(9).fillColor('#334155');
  doc.text('Assinatura do Recebedor', 50, ySign + 5, { width: 250, align: 'center' });
  doc.text('Data: ___ / ___ / ______', 350, ySign + 5, { width: 180, align: 'center' });

  doc.fontSize(8).fillColor('#94A3B8');
  doc.text(`Documento emitido eletronicamente pelo Sistema de Rastreio Incrível do Paulo`, 40, 780, { align: 'center' });

  doc.end();
});

app.listen(PORT, () => {
  console.log(`🚀 Sistema de Rastreio do Paulo (Node.js) rodando em http://localhost:${PORT}`);
});
