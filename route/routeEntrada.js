const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'entradas',
    chave: 'id_entrada',
    campos: ['id_produto', 'id_fornecedor', 'quantidade', 'valor_unitario', 'data_entrada', 'observacao'],
    obrigatorios: ['id_produto', 'id_fornecedor', 'quantidade', 'valor_unitario'],
    movimentaEstoque: true
});