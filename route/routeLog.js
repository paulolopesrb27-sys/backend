const criarCrudRouter = require('./crudRouter');

module.exports = criarCrudRouter({
    tabela: 'logs',
    chave: 'id_log',
    campos: ['usuario', 'tabela_afetada', 'acao', 'registro', 'data_hora']
});