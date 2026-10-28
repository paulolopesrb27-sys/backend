const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'categorias',
    chave: 'id_categoria',
    campos: ['nome', 'descricao', 'ativo'],
    obrigatorios: ['nome']
});