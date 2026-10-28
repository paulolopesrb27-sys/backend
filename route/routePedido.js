const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'pedidos',
    chave: 'id_pedido',
    campos: ['status', 'data_pedido', 'id_cliente']
});