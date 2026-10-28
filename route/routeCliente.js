const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'clientes',
    chave: 'id_cliente',
    campos: ['nome', 'email', 'contato', 'ativo'],
    obrigatorios: ['nome', 'email']
});