const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'clientes',
    chave: 'id_cliente',
    modelo: 'cliente',
    campos: ['nome', 'email', 'contato', 'ativo'],
    obrigatorios: ['nome', 'email']
});