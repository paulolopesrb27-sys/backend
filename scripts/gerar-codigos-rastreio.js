const { randomBytes } = require('node:crypto');
const prisma = require('../database');

async function main() {
  const alvo = 10;
  const existentes = await prisma.rastreamento.findMany({
    include: { pedido: { include: { cliente: { select: { nome: true } } } } },
    orderBy: { id_rastreamento: 'asc' }
  });
  const pedidosVinculados = new Set(existentes.map((item) => item.id_pedido));
  const pedidos = await prisma.pedido.findMany({
    where: { cliente: { isNot: null } },
    include: { cliente: { select: { nome: true } } },
    orderBy: { id_pedido: 'asc' }
  });

  for (const pedido of pedidos) {
    if (existentes.length >= alvo) break;
    if (pedidosVinculados.has(pedido.id_pedido)) continue;

    let codigo;
    do {
      codigo = `RSP${randomBytes(4).toString('hex').toUpperCase()}`;
    } while (await prisma.rastreamento.findUnique({ where: { codigo_rastreio: codigo } }));

    const rastreamento = await prisma.rastreamento.create({
      data: { codigo_rastreio: codigo, id_pedido: pedido.id_pedido },
      include: { pedido: { include: { cliente: { select: { nome: true } } } } }
    });
    existentes.push(rastreamento);
    pedidosVinculados.add(pedido.id_pedido);
  }

  if (existentes.length < alvo) {
    throw new Error(`Só existem ${existentes.length} rastreamentos vinculados; são necessários ${alvo} pedidos com cliente.`);
  }

  console.log('CÓDIGO | PEDIDO | CLIENTE');
  existentes.forEach((item) => {
    console.log(`${item.codigo_rastreio} | #${item.id_pedido} | ${item.pedido.cliente?.nome || 'Cliente não informado'}`);
  });
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());