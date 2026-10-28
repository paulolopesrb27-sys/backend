// 1. Dependências e Middlewares
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// 3. Definição de Rotas
app.use("/login", routeLogin);
app.use("/usuario/login", routeLogin);
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