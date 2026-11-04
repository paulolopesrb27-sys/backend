# API da Loja

## Objetivo

API REST da Loja para apoiar a operação de uma loja: cadastro e consulta de usuários, funcionários, fornecedores, clientes, produtos e categorias; controle de estoque; registro de entradas e saídas; e gerenciamento de pedidos e seus itens. Resolve a necessidade de centralizar esses dados e operações em uma interface HTTP consumível pelo frontend, mantendo os registros relacionados no mesmo banco MySQL/MariaDB.

## Tecnologias

- Node.js e Express
- Prisma ORM com adapter para MySQL/MariaDB
- JSON para envio e retorno dos dados
- bcryptjs para armazenar e validar hashes de senha
- JWT para autenticar as rotas CRUD
- CORS limitado à origem configurada do frontend em produção

O Prisma ORM mapeia as tabelas existentes para modelos e fornece consultas, inserções, atualizações, exclusões e transações sem SQL manual nas operações de persistência. O adapter MariaDB conecta o Prisma ao MySQL/MariaDB. O runtime usa `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`; `DATABASE_URL` é aceita como alternativa pelos comandos do Prisma quando as variáveis `DB_*` não estiverem definidas.

## Variáveis de ambiente

Defina os nomes abaixo no arquivo `.env` local ou na configuração segura do provedor de hospedagem. Não versione `.env` nem inclua valores reais de credenciais ou segredos na documentação.

| Variável | Uso |
|---|---|
| `DB_HOST` | Host do servidor MySQL/MariaDB; obrigatório para iniciar a API. |
| `DB_PORT` | Porta do banco; padrão `3306`. |
| `DB_USER` | Usuário do banco; obrigatório. |
| `DB_PASSWORD` | Senha do banco; obrigatória. |
| `DB_NAME` | Nome do schema; obrigatório. |
| `JWT_SECRET` | Segredo de assinatura dos tokens; obrigatório em produção e com pelo menos 32 caracteres. |
| `FRONTEND_ORIGIN` | Origem HTTPS autorizada pelo CORS; obrigatória em produção. Pode conter origens separadas por vírgula. |
| `PORT` | Porta HTTP da API; padrão `5001` localmente. |
| `DB_SSL` | Use `true` para habilitar TLS na conexão do banco quando exigido pelo provedor. |
| `NODE_ENV` | Use `production` na hospedagem para ativar as verificações de configuração de produção. |
| `DATABASE_URL` | Alternativa para os comandos do Prisma quando as variáveis `DB_*` não estiverem configuradas; não é necessária no runtime da API. |

## Executar

Configure o arquivo `.env` na raiz do projeto:

```env
PORT=5001
DB_HOST=seu_host
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco
JWT_SECRET=gere-um-segredo-aleatorio-com-ao-menos-32-caracteres
DATABASE_URL="mysql://seu_usuario:sua_senha@seu_host:3306/seu_banco"
```

O `npm install` gera o Prisma Client automaticamente. Nenhuma migração é aplicada ao banco durante a inicialização da API.

Instale as dependências e inicie o servidor:

```bash
npm install
npm start
```

Para verificar consultas e operações CRUD contra o banco configurado, execute `npm run test:orm`. O teste cria registros temporários e os remove ao final.

Para desenvolvimento com reinício automático, use `npm run dev`. O comando `npm start` executa o servidor em modo de produção, sem `nodemon`. O servidor usa a porta definida em `PORT` ou `5001` por padrão e escuta em `0.0.0.0`. A URL base local normalmente é `http://localhost:5001`.

## Publicação em hospedagem

Configure no painel do provedor as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` e `FRONTEND_ORIGIN`. O segredo JWT deve ter pelo menos 32 caracteres aleatórios. `FRONTEND_ORIGIN` deve ser a origem HTTPS exata do frontend, sem caminho final. Configure `DB_SSL=true` quando o provedor MySQL exigir TLS. Configure `PORT` somente se o provedor exigir um valor fixo; normalmente a plataforma fornece essa variável automaticamente. Não publique o arquivo `.env` nem credenciais no repositório. A API usa `DB_*` para conectar ao banco; `DATABASE_URL` não é necessária para iniciar o servidor.

O blueprint `render.yaml` prepara a API e o frontend no Render. O banco MySQL/MariaDB é externo e deve ser provisionado separadamente; veja [DEPLOYMENT.md](DEPLOYMENT.md). Não use o dump com dados de exemplo como banco de produção.

Use `npm ci` para instalar as dependências a partir do lockfile; o script `postinstall` gera o Prisma Client. Use `npm start` como comando de inicialização. Não há etapa de build para a API. `GET /health` retorna `200` com `{ "status": "ok", "database": "ok" }` quando o processo e o banco respondem; em falha de conexão, retorna `503`.

### Endereço público

URL pública da API informada pelo serviço Render: **https://backend-wer5.onrender.com**. Use-a como URL base para as chamadas. A raiz `/` apresenta a página inicial da API e `/health` verifica a conexão; a resposta esperada de saúde é `{ "status": "ok", "database": "ok" }`. Se o serviço for renomeado ou recriado, confirme a URL vigente no painel Render. A URL pública do frontend é independente e deve ser obtida no serviço estático correspondente.

## Formato das requisições

O servidor analisa corpos `application/json` e `application/x-www-form-urlencoded`. Para JSON, envie `Content-Type: application/json`. IDs são enviados na URL. Nas rotas CRUD genéricas e nas rotas de atualização, somente os campos permitidos para cada recurso são usados; campos desconhecidos são ignorados. As rotas próprias de funcionários e fornecedores também inserem apenas as colunas listadas nesta documentação.

As listagens retornam todos os registros. Não há parâmetros de paginação, busca ou ordenação implementados.

Exemplo de atualização parcial:

```http
PATCH /produtos/3
Content-Type: application/json
```

```json
{
  "preco": 8.75
}
```

## Login

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/login` | Autentica um usuário pelo e-mail e senha |
| `POST` | `/usuario/login` | Alias de `/login` |

Corpo esperado:

```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha-do-usuario"
}
```

Retorna `200` com `usuario` (dados públicos) e `token` se as credenciais forem válidas e a conta estiver ativa. Senhas incorretas, usuário inexistente ou conta inativa retornam `401`; campos ausentes retornam `400`. A senha não é incluída na resposta. O JWT tem validade de oito horas e requer `JWT_SECRET` configurado em produção.

### Cadastrar usuário e testar login

Não há cadastro público. Como a autenticação é aplicada antes das rotas de recursos, `POST /usuario` também exige um token válido. Para a primeira conta, um administrador deve provisionar um usuário ativo (`ativo = 1`) no banco por um processo administrativo confiável e gravar a senha como hash bcrypt; nunca grave a senha em texto puro. Depois que existir uma conta, cadastre outras usando `POST /usuario` autenticado:

```http
POST /usuario
Authorization: Bearer <token-de-um-usuario-existente>
Content-Type: application/json
```

```json
{
  "nome": "Pessoa de Teste",
  "email": "teste@exemplo.com",
  "senha": "<senha-de-teste>",
  "ativo": 1
}
```

Substitua `<senha-de-teste>` por uma senha de teste escolhida por você. O cadastro retorna `201` e `id_usuario`. Em seguida, teste as credenciais sem cabeçalho de autenticação:

```http
POST /login
Content-Type: application/json
```

```json
{
  "email": "teste@exemplo.com",
  "senha": "<a-mesma-senha-de-teste>"
}
```

Com sucesso, a resposta contém `mensagem`, `usuario` e `token`. Use esse token para acessar recursos protegidos, por exemplo, `GET /produtos` com `Authorization: Bearer <token>`. O usuário deve estar ativo.

Senhas novas são salvas com bcrypt. No primeiro login válido de contas legadas cuja senha ainda esteja em texto puro, a API atualiza o registro para bcrypt.

Todas as rotas de recursos CRUD exigem o cabeçalho `Authorization: Bearer <token>`. `GET /health` e as duas rotas de login permanecem públicas. Tokens ausentes, inválidos ou expirados retornam `401`; se `JWT_SECRET` não estiver configurado corretamente em produção, as rotas protegidas retornam `503`.

## Recursos e endpoints

Todos os recursos abaixo implementam `GET /`, `GET /:id`, `POST /`, `PATCH /:id` e `DELETE /:id`:

Os caminhos são relativos à URL base. Os nomes singulares e plurais são aliases para o mesmo router, exceto onde há apenas um caminho.

| Recurso (tabela) | Caminhos disponíveis | Finalidade |
|---|---|---|
| Usuários (`usuarios`) | `/usuario`, `/usuarios` | Consultar e administrar contas de acesso. |
| Funcionários (`funcionarios`) | `/funcionario`, `/funcionarios` | Administrar funcionários. |
| Fornecedores (`fornecedores`) | `/fornecedor`, `/fornecedores` | Administrar fornecedores. |
| Categorias (`categorias`) | `/categoria`, `/categorias` | Administrar categorias de produtos. |
| Clientes (`clientes`) | `/cliente`, `/clientes` | Administrar clientes. |
| Produtos (`produtos`) | `/produto`, `/produtos` | Administrar catálogo de produtos. |
| Estoque (`estoque`) | `/estoque` | Consultar e administrar quantidades e limites de estoque. |
| Entradas (`entradas`) | `/entrada`, `/entradas` | Registrar entradas de produtos e ajustar estoque. |
| Saídas (`saidas`) | `/saida`, `/saidas` | Registrar saídas de produtos e ajustar estoque. |
| Pedidos (`pedidos`) | `/pedido`, `/pedidos` | Administrar pedidos de clientes. |
| Itens de pedido (`pedido_itens`) | `/pedido-item`, `/pedido_itens` | Administrar produtos e quantidades de cada pedido. |
| Histórico de preços (`historico_precos`) | `/historico-preco`, `/historico_precos` | Consultar e administrar preços por vigência. |
| Movimentações (`movimentacoes`) | `/movimentacao`, `/movimentacoes` | Registrar movimentações de produtos. |
| Logs (`logs`) | `/log`, `/logs` | Consultar e administrar registros de log. |

Em cada caminho de recurso, os métodos e suas finalidades são:

| Método e caminho | Finalidade |
|---|---|
| `GET /` | Listar os registros do recurso. |
| `GET /:id` | Consultar um registro pela chave indicada na tabela abaixo. |
| `POST /` | Cadastrar um registro. |
| `PATCH /:id` | Atualizar parcialmente um registro existente. |
| `DELETE /:id` | Excluir um registro. |

Além dos recursos CRUD, as rotas públicas são:

| Método e caminho | Finalidade | Resposta |
|---|---|---|
| `GET /` | Exibir a página inicial da API, com links para o frontend e os endpoints públicos. | HTML (`200`). |
| `GET /health` | Verificar a disponibilidade da API e do banco. | JSON; `200` se o banco responder, `503` em caso de falha. |
| `POST /login` | Autenticar uma conta pelo e-mail e senha. | JSON com dados públicos do usuário e JWT, ou erro JSON. |
| `POST /usuario/login` | Alias de `/login`. | Mesmo formato de `/login`. |

Os métodos de atualização dos recursos são `PATCH`; não há rota `PUT` implementada.

Chaves usadas em `GET`, `PATCH` e `DELETE` por ID:

| Recurso | Chave |
|---|---|
| Usuários | `id_usu` |
| Funcionários | `id_funcionario` |
| Fornecedores | `id_fornecedor` |
| Categorias | `id_categoria` |
| Clientes | `id_cliente` |
| Produtos | `id_produto` |
| Estoque | `id_estoque` |
| Entradas | `id_entrada` |
| Saídas | `id_saida` |
| Pedidos | `id_pedido` |
| Itens de pedido | `id_item` |
| Histórico de preços | `id_historico` |
| Movimentações | `id_movimentacao` |
| Logs | `id_log` |

Substitua `:id` pela chave do registro. Exemplo: `GET /produtos/3`.

## Campos aceitos

Os campos abaixo são graváveis por `POST` e `PATCH`, exceto quando indicado. Chaves primárias e campos de data de criação/atualização gerenciados pelo banco não são enviados nos CRUDs genéricos.

| Recurso | Campos aceitos | Obrigatórios verificados pela rota no POST |
|---|---|---|
| Categorias | `nome`, `descricao`, `ativo` | `nome` |
| Clientes | `nome`, `email`, `contato`, `ativo` | `nome`, `email` |
| Produtos | `nome`, `descricao`, `preco`, `imagem_produto` | `descricao`, `imagem_produto` |
| Estoque | `id_produto`, `quantidade`, `estoque_minimo`, `estoque_maximo`, `localizacao` | `id_produto`, `quantidade` |
| Entradas | `id_produto`, `id_fornecedor`, `quantidade`, `valor_unitario`, `data_entrada`, `observacao` | `id_produto`, `id_fornecedor`, `quantidade`, `valor_unitario` |
| Saídas | `id_produto`, `id_funcionario`, `quantidade`, `valor_unitario`, `data_saida`, `destino` | `id_produto`, `id_funcionario`, `quantidade`, `valor_unitario` |
| Pedidos | `status`, `data_pedido`, `id_cliente` | Nenhum definido pela rota |
| Itens de pedido | `id_pedido`, `id_produto`, `quantidade`, `valor_unitario`, `subtotal` | Nenhum definido pela rota |
| Histórico de preços | `id_produto`, `preco`, `vigencia` | Nenhum definido pela rota |
| Movimentações | `id_produto`, `tipo`, `quantidade`, `data_movimentacao`, `observacao` | Nenhum definido pela rota |
| Logs | `usuario`, `tabela_afetada`, `acao`, `registro`, `data_hora` | Nenhum definido pela rota |
| Funcionários | `nome`, `cargo`, `salario`, `telefone`, `email`, `data_admissao`, `ativo` | Nenhum. Campos exigidos pelo schema MySQL podem fazer a inserção falhar |
| Fornecedores | `nome`, `empresa`, `email`, `telefone`, `cidade`, `estado`, `ativo` | Nenhum. Campos exigidos pelo schema MySQL podem fazer a inserção falhar |
| Usuários | `nome`, `email`, `senha`, `contato`, `genero`, `ativo` | `senha` deve ser uma string não vazia; nome e e-mail são exigidos pelo schema MySQL |

Nas rotas CRUD genéricas, os campos obrigatórios são verificados pela presença da propriedade no JSON; a rota não valida formato, faixa ou valor não vazio. Restrições adicionais do banco são reportadas como erro `500`. Nas rotas próprias de funcionários e fornecedores, o `POST` não faz validação de obrigatoriedade antes da consulta ao banco. Para usuários, a rota valida apenas a senha no `POST`; no `PATCH`, a senha, quando enviada, também deve ser uma string não vazia e é armazenada como hash bcrypt.

Valores possíveis de `movimentacoes.tipo`, conforme o banco: `E`, `S`, `A`, `P` ou `T`.

## Regras de negócio relevantes

- O cadastro de uma entrada atualiza o estoque pelo trigger configurado no banco.
- O cadastro de uma saída reduz o estoque pelo trigger configurado no banco.
- Alterar ou remover uma entrada/saída ajusta o estoque pela rota, dentro da mesma transação da operação.
- O estoque possui uma linha por produto, devido à restrição única em `estoque.id_produto`.
- Não existe rota de login para funcionários: o login implementado é para registros ativos da tabela `usuarios`.
- Qualquer usuário autenticado pode acessar as operações CRUD; não há papéis ou permissões por função.

## Respostas e erros

- `200`: consulta concluída; também é retornado por `PATCH` e `DELETE` das rotas CRUD genéricas.
- `201`: registro criado.
- `202`: atualização ou remoção nas rotas próprias de usuários, funcionários e fornecedores.
- `400`: campos obrigatórios do CRUD genérico ausentes, nenhum campo permitido para criar/atualizar, ou senha ausente/inválida nas operações de usuário/login.
- `401`: credenciais de login inválidas ou conta inativa.
- `401`: token de acesso ausente, inválido ou expirado em rota CRUD.
- `503`: `JWT_SECRET` ausente ou curto demais em produção.
- `404`: registro ou caminho não encontrado.
- `500`: erro de conexão, execução no banco ou processamento.

Nas rotas CRUD genéricas, `GET` de coleção retorna `{ "tabela": [...] }`, `GET` por ID retorna `{ "tabela": { ... } }`, `POST` retorna uma mensagem e a chave primária criada, e `PATCH`/`DELETE` retornam uma mensagem. Nas rotas próprias, a consulta individual usa chaves singulares (`usuario`, `funcionario` ou `fornecedor`); o cadastro de usuário retorna `id_usuario`, enquanto a chave da tabela é `id_usu`. A senha nunca é incluída nas respostas de consulta ou login.

O formato de erro não é uniforme: handlers de recursos normalmente retornam `{ "mensagem": "..." }` para erros de validação ou ausência do registro e `{ "error": ... }` para erros do banco. O fallback global para caminhos sem rota retorna `{ "erro": { "mensagem": "Não encontrado!" } }`.
