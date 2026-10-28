const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'historico_precos',
    chave: 'id_historico',
    campos: ['id_produto', 'preco', 'vigencia']
});