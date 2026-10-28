const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'estoque',
    chave: 'id_estoque',
    campos: ['id_produto', 'quantidade', 'estoque_minimo', 'estoque_maximo', 'localizacao'],
    obrigatorios: ['id_produto', 'quantidade']
});