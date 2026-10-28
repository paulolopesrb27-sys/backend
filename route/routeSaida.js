const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'saidas',
    chave: 'id_saida',
    campos: ['id_produto', 'id_funcionario', 'quantidade', 'valor_unitario', 'data_saida', 'destino'],
    obrigatorios: ['id_produto', 'id_funcionario', 'quantidade', 'valor_unitario'],
    movimentaEstoque: true
});