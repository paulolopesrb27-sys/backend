const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'pedidos',
    chave: 'id_pedido',
    modelo: 'pedido',
    campos: ['status', 'data_pedido', 'id_cliente']
});