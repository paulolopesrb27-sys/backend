const { randomInt } = require('node:crypto');
const prisma = require('../database');

const ruas = [
  'Rua das Palmeiras', 'Rua Ipê Roxo', 'Rua das Acácias', 'Rua do Buriti',
  'Rua dos Girassóis', 'Rua Tocantins', 'Rua Araguaia', 'Rua das Mangueiras',
  'Rua Perimetral', 'Rua 13 de Maio', 'Rua dos Cajueiros', 'Rua Faveira'
];
const bairros = [
  'Setor Central', 'São João', 'Neblina', 'Jardim Goiás', 'Araguaína Sul',
  'Entroncamento', 'Senador', 'Vila Aliança', 'Jardim Filadélfia', 'Setor Brasil'
];

async function main() {
  const registros = await prisma.rastreamento.findMany({ orderBy: { id_rastreamento: 'asc' } });
  if (registros.length < 10) throw new Error(`Esperados ao menos 10 rastreamentos, encontrados ${registros.length}.`);

  const ruasDisponiveis = [...ruas];
  const bairrosDisponiveis = [...bairros];
  for (const registro of registros.slice(0, 10)) {
    if (registro.endereco && registro.bairro) continue;
    const rua = ruasDisponiveis.splice(randomInt(ruasDisponiveis.length), 1)[0];
    const bairro = bairrosDisponiveis.splice(randomInt(bairrosDisponiveis.length), 1)[0];
    const endereco = `${rua}, ${randomInt(20, 999)}`;
    await prisma.rastreamento.update({
      where: { id_rastreamento: registro.id_rastreamento },
      data: { endereco, bairro, cidade: 'Araguaína', estado: 'TO' }
    });
    console.log(`${registro.codigo_rastreio} | ${endereco} | ${bairro} | Araguaína - TO`);
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());