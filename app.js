// 1. Dependências e Middlewares
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const { requireAuthentication } = require('./auth');
const prisma = require('./database');
const app = express();

const frontendOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && frontendOrigins.length === 0) {
  throw new Error('Configure FRONTEND_ORIGIN com a origem HTTPS do frontend.');
}

const allowedOrigins = new Set(frontendOrigins);
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Importação das Rotas
const routeUsuario = require("./route/routeUsuario");
const routeLogin = require("./route/routeLogin");
const routeFuncionario = require("./route/routeFuncionario");
const routeFornecedor = require("./route/routeFornecedor");
const routeCategoria = require("./route/routeCategoria");
const routeCliente = require("./route/routeCliente");
const routeProduto = require("./route/routeProduto");
const routeEstoque = require("./route/routeEstoque");
const routeEntrada = require("./route/routeEntrada");
const routeSaida = require("./route/routeSaida");
const routePedido = require("./route/routePedido");
const routePedidoItem = require("./route/routePedidoItem");
const routeHistoricoPreco = require("./route/routeHistoricoPreco");
const routeMovimentacao = require("./route/routeMovimentacao");
const routeLog = require("./route/routeLog");

// 2. Controle de CORS (Headers & OPTIONS)
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.get('/', (req, res) => {
  const frontendUrl = frontendOrigins[0] || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : null);
  const frontendLink = frontendUrl
    ? `<a class="primary-link" href="${frontendUrl}">Abrir sistema <span aria-hidden="true">&#8599;</span></a>`
    : '<p class="notice">Frontend ainda não configurado.</p>';

  res.type('html').send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f3f5ef">
  <title>Loja Oficial | API</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", Arial, sans-serif; color: #17231d; background: #f3f5ef; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; padding: 32px 20px; display: grid; place-items: center; background: radial-gradient(ellipse at 12% 10%, #dce9d9 0, transparent 38%), radial-gradient(ellipse at 92% 90%, #f0dfc7 0, transparent 34%), #f3f5ef; }
    main { width: min(100%, 760px); padding: clamp(26px, 6vw, 56px); border: 1px solid #d5ddd3; border-radius: 8px; background: rgba(255,255,255,.92); box-shadow: 0 24px 70px rgba(34, 52, 39, .09); }
    .eyebrow { margin: 0 0 14px; color: #55725c; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; max-width: 12ch; font-family: Georgia, "Times New Roman", serif; font-size: clamp(38px, 7vw, 64px); font-weight: 500; line-height: 1.02; }
    .intro { max-width: 55ch; margin: 18px 0 30px; color: #526057; font-size: 17px; line-height: 1.6; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 36px; }
    a { color: #235d42; font-weight: 650; }
    .primary-link { display: inline-flex; min-height: 46px; align-items: center; gap: 18px; padding: 0 17px; border-radius: 4px; background: #235d42; color: white; text-decoration: none; }
    .secondary-link { padding: 12px 4px; text-decoration-thickness: 1px; text-underline-offset: 4px; }
    .notice { margin: 0; color: #74552c; }
    .resources { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #dbe2d8; border-radius: 5px; background: #dbe2d8; }
    .resource { min-width: 0; padding: 17px; background: #fbfcf9; text-decoration: none; }
    .resource strong { display: block; margin-bottom: 6px; color: #26382c; font-size: 14px; }
    .resource span { color: #68746b; font-size: 13px; font-weight: 400; overflow-wrap: anywhere; }
    footer { margin-top: 24px; color: #778078; font-size: 12px; }
    @media (max-width: 520px) { body { padding: 14px; } main { padding: 28px 22px; } .resources { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Loja Oficial · Serviços</p>
    <h1>API da Loja</h1>
    <p class="intro">Serviços de catálogo, clientes, pedidos e controle de estoque. A API está pronta para receber requisições.</p>
    <div class="actions">
      ${frontendLink}
      <a class="secondary-link" href="/health">Verificar conexão</a>
    </div>
    <section class="resources" aria-label="Endpoints públicos">
      <a class="resource" href="/health"><strong>Saúde da API</strong><span>GET /health</span></a>
      <a class="resource" href="/login"><strong>Autenticação</strong><span>POST /login</span></a>
    </section>
    <footer>Rotas de dados protegidas por autenticação.</footer>
  </main>
</body>
</html>`);
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
});

// 3. Definição de Rotas
app.use("/login", routeLogin);
app.use("/usuario/login", routeLogin);
app.use(requireAuthentication);
app.use("/usuario", routeUsuario);
app.use("/usuarios", routeUsuario);
app.use("/funcionario", routeFuncionario);
app.use("/funcionarios", routeFuncionario);
app.use("/fornecedor", routeFornecedor); // ✅ Corrigido de routeFornecedores para routeFornecedor
app.use("/fornecedores", routeFornecedor);
app.use(["/categoria", "/categorias"], routeCategoria);
app.use(["/cliente", "/clientes"], routeCliente);
app.use(["/produto", "/produtos"], routeProduto);
app.use("/estoque", routeEstoque);
app.use(["/entrada", "/entradas"], routeEntrada);
app.use(["/saida", "/saidas"], routeSaida);
app.use(["/pedido", "/pedidos"], routePedido);
app.use(["/pedido-item", "/pedido_itens"], routePedidoItem);
app.use(["/historico-preco", "/historico_precos"], routeHistoricoPreco);
app.use(["/movimentacao", "/movimentacoes"], routeMovimentacao);
app.use(["/log", "/logs"], routeLog);

// 4. Tratamento de Erros (Fallback & Handler)
app.use((req, res, next) => {
  const erro = new Error("Não encontrado!");
  erro.status = 404;
  next(erro);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  return res.json({
    erro: {
      mensagem: error.message
    }
  });
});

module.exports = app;