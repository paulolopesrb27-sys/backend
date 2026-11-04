const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'pedido_itens',
    chave: 'id_item',
    modelo: 'pedidoItem',
    campos: ['id_pedido', 'id_produto', 'quantidade', 'valor_unitario', 'subtotal']
});