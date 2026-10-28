const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'produtos',
    chave: 'id_produto',
    campos: ['nome', 'descricao', 'preco', 'imagem_produto'],
    obrigatorios: ['descricao', 'imagem_produto']
});