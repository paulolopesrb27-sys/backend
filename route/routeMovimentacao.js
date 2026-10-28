const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'movimentacoes',
    chave: 'id_movimentacao',
    campos: ['id_produto', 'tipo', 'quantidade', 'data_movimentacao', 'observacao']
});