const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'produtos',
    chave: 'id_produto',
    modelo: 'produto',
    campos: ['nome', 'descricao', 'preco', 'imagem_produto'],
    obrigatorios: ['descricao', 'imagem_produto']
});