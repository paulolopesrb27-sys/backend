process.env.NODE_ENV = 'test';

const http = require('node:http');
const assert = require('node:assert/strict');
const app = require('../app');
const prisma = require('../database');
const { createToken } = require('../auth');

const suffix = `${Date.now()}-${process.pid}`;
const email = `orm-check-${suffix}@example.test`;
const categoryName = `ORM check ${suffix}`;
const token = createToken({ id_usu: -1, email });
const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json'
};
let categoryId;
let employeeId;
let supplierId;
let userId;
let entradaId;
let saidaId;
let clientId;
let productId;
let stockId;
let orderId;
let itemId;
let historyId;
let movementId;
let logId;

async function request(server, method, path, body) {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    return { status: response.status, data };
}

function expectStatus(result, status, label) {
    assert.equal(result.status, status, `${label}: ${JSON.stringify(result.data)}`);
}

async function main() {
    const server = http.createServer(app);
    let result;
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
        const resources = [
            '/categorias', '/clientes', '/entradas', '/estoque', '/fornecedores',
            '/funcionarios', '/historico-preco', '/logs', '/movimentacoes', '/pedidos',
            '/pedido-item', '/produtos', '/saidas', '/usuario'
        ];
        for (const resource of resources) {
            const result = await request(server, 'GET', resource);
            expectStatus(result, 200, `GET ${resource}`);
        }

        const [produto, fornecedor, funcionario] = await Promise.all([
            prisma.produto.findFirst({ select: { id_produto: true } }),
            prisma.fornecedor.findFirst({ select: { id_fornecedor: true } }),
            prisma.funcionario.findFirst({ select: { id_funcionario: true } })
        ]);
        if (!produto || !fornecedor || !funcionario) {
            throw new Error('Teste de estoque requer ao menos um produto, fornecedor e funcionário cadastrados.');
        }

        result = await request(server, 'POST', '/clientes', {
            nome: `ORM ${suffix}`,
            email: `client-${suffix}@example.test`
        });
        expectStatus(result, 201, 'POST /clientes');
        clientId = result.data.id_cliente;
        result = await request(server, 'GET', `/clientes/${clientId}`);
        expectStatus(result, 200, 'GET /clientes/:id');
        expectStatus(await request(server, 'PATCH', `/clientes/${clientId}`, { contato: '00000000' }), 200, 'PATCH /clientes/:id');

        result = await request(server, 'POST', '/produtos', {
            nome: `ORM ${suffix}`,
            descricao: 'Produto temporário para teste ORM',
            preco: 1.25,
            imagem_produto: 'https://example.test/orm-test.png'
        });
        expectStatus(result, 201, 'POST /produtos');
        productId = result.data.id_produto;
        result = await request(server, 'GET', `/produtos/${productId}`);
        expectStatus(result, 200, 'GET /produtos/:id');
        expectStatus(await request(server, 'PATCH', `/produtos/${productId}`, { nome: `ORM atualizado ${suffix}` }), 200, 'PATCH /produtos/:id');

        result = await request(server, 'POST', '/estoque', { id_produto: productId, quantidade: 8 });
        expectStatus(result, 201, 'POST /estoque');
        stockId = result.data.id_estoque;
        result = await request(server, 'GET', `/estoque/${stockId}`);
        expectStatus(result, 200, 'GET /estoque/:id');
        expectStatus(await request(server, 'PATCH', `/estoque/${stockId}`, { quantidade: 9 }), 200, 'PATCH /estoque/:id');

        result = await request(server, 'POST', '/historico-preco', {
            id_produto: productId,
            preco: 1.5,
            vigencia: '2026-10-30'
        });
        expectStatus(result, 201, 'POST /historico-preco');
        historyId = result.data.id_historico;
        result = await request(server, 'GET', `/historico-preco/${historyId}`);
        expectStatus(result, 200, 'GET /historico-preco/:id');
        expectStatus(await request(server, 'PATCH', `/historico-preco/${historyId}`, { preco: 1.75 }), 200, 'PATCH /historico-preco/:id');

        result = await request(server, 'POST', '/movimentacoes', {
            id_produto: productId,
            tipo: 'E',
            quantidade: 2,
            data_movimentacao: '2026-10-30T12:00:00.000Z'
        });
        expectStatus(result, 201, 'POST /movimentacoes');
        movementId = result.data.id_movimentacao;
        result = await request(server, 'GET', `/movimentacoes/${movementId}`);
        expectStatus(result, 200, 'GET /movimentacoes/:id');
        expectStatus(await request(server, 'PATCH', `/movimentacoes/${movementId}`, { observacao: 'Atualizada' }), 200, 'PATCH /movimentacoes/:id');

        result = await request(server, 'POST', '/pedidos', { id_cliente: clientId, data_pedido: '2026-10-30' });
        expectStatus(result, 201, 'POST /pedidos');
        orderId = result.data.id_pedido;
        result = await request(server, 'GET', `/pedidos/${orderId}`);
        expectStatus(result, 200, 'GET /pedidos/:id');
        expectStatus(await request(server, 'PATCH', `/pedidos/${orderId}`, { status: 0 }), 200, 'PATCH /pedidos/:id');

        result = await request(server, 'POST', '/pedido-item', {
            id_pedido: orderId,
            id_produto: productId,
            quantidade: 2,
            valor_unitario: 1.25,
            subtotal: 2.5
        });
        expectStatus(result, 201, 'POST /pedido-item');
        itemId = result.data.id_item;
        result = await request(server, 'GET', `/pedido-item/${itemId}`);
        expectStatus(result, 200, 'GET /pedido-item/:id');
        expectStatus(await request(server, 'PATCH', `/pedido-item/${itemId}`, { quantidade: 3 }), 200, 'PATCH /pedido-item/:id');

        result = await request(server, 'POST', '/logs', {
            usuario: `ORM ${suffix}`,
            tabela_afetada: 'logs',
            acao: 'teste',
            registro: 1,
            data_hora: '2026-10-30T12:00:00.000Z'
        });
        expectStatus(result, 201, 'POST /logs');
        logId = result.data.id_log;
        result = await request(server, 'GET', `/logs/${logId}`);
        expectStatus(result, 200, 'GET /logs/:id');
        expectStatus(await request(server, 'PATCH', `/logs/${logId}`, { acao: 'atualizado' }), 200, 'PATCH /logs/:id');

        const estoqueInicialEntrada = await prisma.estoque.findUnique({ where: { id_produto: produto.id_produto } });
        result = await request(server, 'POST', '/entradas', {
            id_produto: produto.id_produto,
            id_fornecedor: fornecedor.id_fornecedor,
            quantidade: 3,
            valor_unitario: 1.25,
            observacao: `ORM integration ${suffix}`
        });
        expectStatus(result, 201, 'POST /entradas');
        entradaId = result.data.id_entrada;
        let estoque = await prisma.estoque.findUnique({ where: { id_produto: produto.id_produto } });
        assert.equal(estoque.quantidade, (estoqueInicialEntrada?.quantidade ?? 0) + 3);
        expectStatus(await request(server, 'PATCH', `/entradas/${entradaId}`, { quantidade: 5 }), 200, 'PATCH /entradas/:id');
        estoque = await prisma.estoque.findUnique({ where: { id_produto: produto.id_produto } });
        assert.equal(estoque.quantidade, (estoqueInicialEntrada?.quantidade ?? 0) + 5);
        expectStatus(await request(server, 'DELETE', `/entradas/${entradaId}`), 200, 'DELETE /entradas/:id');
        entradaId = undefined;
        estoque = await prisma.estoque.findUnique({ where: { id_produto: produto.id_produto } });
        assert.equal(estoque.quantidade, estoqueInicialEntrada?.quantidade ?? 0);

        result = await request(server, 'POST', '/categorias', { nome: categoryName, ativo: 1 });
        expectStatus(result, 201, 'POST /categorias');
        categoryId = result.data.id_categoria;
        result = await request(server, 'GET', `/categorias/${categoryId}`);
        expectStatus(result, 200, 'GET /categorias/:id');
        assert.equal(result.data.categorias.nome, categoryName);
        expectStatus(await request(server, 'PATCH', `/categorias/${categoryId}`, { descricao: 'Atualizado via Prisma' }), 200, 'PATCH /categorias/:id');
        expectStatus(await request(server, 'DELETE', `/categorias/${categoryId}`), 200, 'DELETE /categorias/:id');
        categoryId = undefined;

        result = await request(server, 'POST', '/funcionarios', {
            nome: `ORM ${suffix}`,
            cargo: 'Validação',
            salario: 1000,
            data_admissao: '2026-10-30',
            ativo: 1
        });
        expectStatus(result, 201, 'POST /funcionarios');
        employeeId = result.data.id_funcionario;
        expectStatus(await request(server, 'GET', `/funcionarios/${employeeId}`), 200, 'GET /funcionarios/:id');
        expectStatus(await request(server, 'PATCH', `/funcionarios/${employeeId}`, { cargo: 'Validado' }), 202, 'PATCH /funcionarios/:id');
        expectStatus(await request(server, 'DELETE', `/funcionarios/${employeeId}`), 202, 'DELETE /funcionarios/:id');
        employeeId = undefined;

        result = await request(server, 'POST', '/fornecedores', { nome: `ORM ${suffix}`, ativo: 1 });
        expectStatus(result, 201, 'POST /fornecedores');
        supplierId = result.data.id_fornecedor;
        expectStatus(await request(server, 'GET', `/fornecedores/${supplierId}`), 200, 'GET /fornecedores/:id');
        expectStatus(await request(server, 'PATCH', `/fornecedores/${supplierId}`, { empresa: 'Validação Prisma' }), 202, 'PATCH /fornecedores/:id');
        expectStatus(await request(server, 'DELETE', `/fornecedores/${supplierId}`), 202, 'DELETE /fornecedores/:id');
        supplierId = undefined;

        const estoqueInicialSaida = await prisma.estoque.findFirst({ where: { quantidade: { gte: 1 } } });
        if (estoqueInicialSaida) {
            result = await request(server, 'POST', '/saidas', {
                id_produto: estoqueInicialSaida.id_produto,
                id_funcionario: funcionario.id_funcionario,
                quantidade: 1,
                valor_unitario: 1.25,
                destino: `ORM integration ${suffix}`
            });
            expectStatus(result, 201, 'POST /saidas');
            saidaId = result.data.id_saida;
            let estoqueAtual = await prisma.estoque.findUnique({ where: { id_produto: estoqueInicialSaida.id_produto } });
            assert.equal(estoqueAtual.quantidade, estoqueInicialSaida.quantidade - 1);
            expectStatus(await request(server, 'PATCH', `/saidas/${saidaId}`, { quantidade: 2 }), 200, 'PATCH /saidas/:id');
            estoqueAtual = await prisma.estoque.findUnique({ where: { id_produto: estoqueInicialSaida.id_produto } });
            assert.equal(estoqueAtual.quantidade, estoqueInicialSaida.quantidade - 2);
            expectStatus(await request(server, 'DELETE', `/saidas/${saidaId}`), 200, 'DELETE /saidas/:id');
            saidaId = undefined;
            estoqueAtual = await prisma.estoque.findUnique({ where: { id_produto: estoqueInicialSaida.id_produto } });
            assert.equal(estoqueAtual.quantidade, estoqueInicialSaida.quantidade);
        }

        result = await request(server, 'POST', '/usuario', {
            nome: `ORM ${suffix}`,
            email,
            senha: 'temporary-test-password',
            ativo: 1
        });
        expectStatus(result, 201, 'POST /usuario');
        userId = result.data.id_usuario;
        result = await request(server, 'GET', `/usuario/${userId}`);
        expectStatus(result, 200, 'GET /usuario/:id');
        assert.equal(Object.prototype.hasOwnProperty.call(result.data.usuario, 'senha'), false);
        expectStatus(await request(server, 'PATCH', `/usuario/${userId}`, { contato: '00000000' }), 202, 'PATCH /usuario/:id');
        result = await request(server, 'POST', '/login', { email, senha: 'temporary-test-password' });
        expectStatus(result, 200, 'POST /login');
        assert.equal(Boolean(result.data.token), true);
        assert.equal(Object.prototype.hasOwnProperty.call(result.data.usuario, 'senha'), false);
        expectStatus(await request(server, 'DELETE', `/usuario/${userId}`), 202, 'DELETE /usuario/:id');
        userId = undefined;

        expectStatus(await request(server, 'DELETE', `/logs/${logId}`), 200, 'DELETE /logs/:id');
        logId = undefined;
        expectStatus(await request(server, 'DELETE', `/pedido-item/${itemId}`), 200, 'DELETE /pedido-item/:id');
        itemId = undefined;
        expectStatus(await request(server, 'DELETE', `/historico-preco/${historyId}`), 200, 'DELETE /historico-preco/:id');
        historyId = undefined;
        expectStatus(await request(server, 'DELETE', `/movimentacoes/${movementId}`), 200, 'DELETE /movimentacoes/:id');
        movementId = undefined;
        expectStatus(await request(server, 'DELETE', `/pedidos/${orderId}`), 200, 'DELETE /pedidos/:id');
        orderId = undefined;
        expectStatus(await request(server, 'DELETE', `/estoque/${stockId}`), 200, 'DELETE /estoque/:id');
        stockId = undefined;
        expectStatus(await request(server, 'DELETE', `/produtos/${productId}`), 200, 'DELETE /produtos/:id');
        productId = undefined;
        expectStatus(await request(server, 'DELETE', `/clientes/${clientId}`), 200, 'DELETE /clientes/:id');
        clientId = undefined;

        console.log('Prisma integration passed: all resource listings and CRUD, login, and stock movement operations.');
    } finally {
        if (entradaId) await request(server, 'DELETE', `/entradas/${entradaId}`);
        if (saidaId) await request(server, 'DELETE', `/saidas/${saidaId}`);
        if (categoryId) await prisma.categoria.deleteMany({ where: { id_categoria: categoryId } });
        if (employeeId) await prisma.funcionario.deleteMany({ where: { id_funcionario: employeeId } });
        if (supplierId) await prisma.fornecedor.deleteMany({ where: { id_fornecedor: supplierId } });
        if (userId) await prisma.usuario.deleteMany({ where: { id_usu: userId } });
        if (itemId) await prisma.pedidoItem.deleteMany({ where: { id_item: itemId } });
        if (historyId) await prisma.historicoPreco.deleteMany({ where: { id_historico: historyId } });
        if (movementId) await prisma.movimentacao.deleteMany({ where: { id_movimentacao: movementId } });
        if (logId) await prisma.log.deleteMany({ where: { id_log: logId } });
        if (orderId) await prisma.pedido.deleteMany({ where: { id_pedido: orderId } });
        if (stockId) await prisma.estoque.deleteMany({ where: { id_estoque: stockId } });
        if (productId) await prisma.produto.deleteMany({ where: { id_produto: productId } });
        if (clientId) await prisma.cliente.deleteMany({ where: { id_cliente: clientId } });
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});