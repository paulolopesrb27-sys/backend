# API da Loja

## Visão geral

Esta API em Node.js + Express expõe os recursos do sistema de loja, incluindo autenticação, usuários, funcionários, fornecedores, clientes, produtos, estoque, entradas, saídas, pedidos, itens de pedido, histórico de preços, movimentações e logs.

A aplicação usa Prisma para acessar o banco MySQL/MariaDB e exige autenticação em praticamente todas as rotas protegidas. O arquivo principal de rotas é o `app.js`, e o backend usa `requireAuthentication` antes dos endpoints de dados.

## Tecnologias

- Node.js
- Express
- Prisma ORM
- MySQL/MariaDB via Prisma adapter MariaDB
- JWT para autenticação
- bcryptjs para senha
- CORS para controle de origem

## Configuração e ambiente

Crie um arquivo `.env` na raiz do projeto com pelo menos estas variáveis:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco
JWT_SECRET=gere-um-segredo-com-mais-de-32-caracteres
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/seu_banco"
```

### Variáveis principais

| Nome | Descrição |
|---|---|
| `DB_HOST` | Host do banco |
| `DB_PORT` | Porta do banco (`3306` por padrão) |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_NAME` | Nome do schema |
| `JWT_SECRET` | Segredo para assinar o token JWT |
| `FRONTEND_ORIGIN` | Origem permitida pelo CORS |
| `PORT` | Porta do servidor em produção/desenvolvimento |
| `NODE_ENV` | `development` ou `production` |
| `DATABASE_URL` | Uso opcional para Prisma, não obrigatório para o runtime |

## Execução

```bash
npm install
npm start
```

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

A API fica normalmente em:

```text
http://localhost:5001
```

## Endpoints públicos

### `GET /`

Retorna a página inicial HTML da API com links para o frontend e verificação de saúde.

### `GET /health`

Verifica a conexão com o banco.

Resposta de sucesso:

```json
{
  "status": "ok",
  "database": "ok"
}
```

Resposta de falha:

```json
{
  "status": "unavailable",
  "database": "unavailable"
}
```

### `POST /login`

Autentica um usuário do sistema usando e-mail e senha.

Body:

```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

Resposta de sucesso:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "usuario": {
    "id_usu": 1,
    "nome": "João",
    "email": "usuario@exemplo.com",
    "contato": null,
    "genero": null,
    "ativo": 1
  },
  "token": "<jwt>"
}
```

Se a senha estiver errada, o usuário não existir, ou a conta não estiver ativa, retorna `401`.

### `POST /usuario/login`

Alias de `/login`.

---

## Autenticação

Todas as rotas de recursos protegidos exigem:

```http
Authorization: Bearer <token>
```

O token é gerado no login com expiração de 8 horas. Caso o cabeçalho falte, esteja ausente ou seja inválido, a API retorna `401`.

Se `JWT_SECRET` não estiver configurado corretamente em produção, as rotas protegidas podem responder `503`.

---

## Rotas protegidas (CRUD)

O backend expõe endpoints em plural e singular para a maioria dos recursos. A lista abaixo representa os caminhos disponíveis:

| Recurso | Rotas disponíveis |
|---|---|
| Usuários | `/usuario`, `/usuarios` |
| Funcionários | `/funcionario`, `/funcionarios` |
| Fornecedores | `/fornecedor`, `/fornecedores` |
| Categorias | `/categoria`, `/categorias` |
| Clientes | `/cliente`, `/clientes` |
| Produtos | `/produto`, `/produtos` |
| Estoque | `/estoque` |
| Entradas | `/entrada`, `/entradas` |
| Saídas | `/saida`, `/saidas` |
| Pedidos | `/pedido`, `/pedidos` |
| Itens de pedido | `/pedido-item`, `/pedido_itens` |
| Histórico de preços | `/historico-preco`, `/historico_precos` |
| Movimentações | `/movimentacao`, `/movimentacoes` |
| Logs | `/log`, `/logs` |

### Operações disponíveis

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/recurso` | Lista todos os registros |
| `GET` | `/recurso/:id` | Busca um registro por ID |
| `POST` | `/recurso` | Cria um registro |
| `PATCH` | `/recurso/:id` | Atualiza parcialmente um registro |
| `DELETE` | `/recurso/:id` | Remove um registro |

> Não existe rota `PUT`; a atualização implementada é `PATCH`.

---

## Chaves primárias por recurso

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

Exemplo:

```http
GET /produtos/3
Authorization: Bearer <token>
```

---

## Campos principais por recurso

Os campos aceitos variam conforme a rota; a validação é simples e a API usa apenas os campos presentes no body.

### Usuários

Campos permitidos:

```json
{
  "nome": "João da Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123",
  "contato": "11999999999",
  "genero": "M",
  "ativo": 1
}
```

Regras:
- `senha` é obrigatória em cadastro e também na atualização quando enviada.
- A senha é armazenada com hash bcrypt.
- `POST /usuario` exige autenticação.

### Produtos

Campos permitidos:

```json
{
  "nome": "Camiseta",
  "descricao": "Camiseta básica de algodão",
  "preco": 59.9,
  "imagem_produto": "https://exemplo.com/imagem.jpg"
}
```

### Categorias

Campos permitidos:

```json
{
  "nome": "Roupas",
  "descricao": "Produtos de vestuário",
  "ativo": 1
}
```

### Clientes

Campos permitidos:

```json
{
  "nome": "Maria",
  "email": "maria@exemplo.com",
  "contato": "11988888888",
  "ativo": 1
}
```

### Estoque

Campos permitidos:

```json
{
  "id_produto": 10,
  "quantidade": 20,
  "estoque_minimo": 5,
  "estoque_maximo": 50,
  "localizacao": "Prateleira A1"
}
```

### Entradas e saídas

Entradas:

```json
{
  "id_produto": 10,
  "id_fornecedor": 2,
  "quantidade": 10,
  "valor_unitario": 25.5,
  "data_entrada": "2026-11-13",
  "observacao": "Compra mensal"
}
```

Saídas:

```json
{
  "id_produto": 10,
  "id_funcionario": 1,
  "quantidade": 3,
  "valor_unitario": 29.9,
  "data_saida": "2026-11-13",
  "destino": "Loja principal"
}
```

### Pedidos e itens

Pedidos:

```json
{
  "status": "pendente",
  "data_pedido": "2026-11-13",
  "id_cliente": 1
}
```

Itens de pedido:

```json
{
  "id_pedido": 1,
  "id_produto": 10,
  "quantidade": 2,
  "valor_unitario": 39.9,
  "subtotal": 79.8
}
```

---

## Respostas e códigos HTTP

### Sucesso

| Código | Significado |
|---|---|
| `200` | Consulta ou atualização concluída |
| `201` | Registro criado |
| `202` | Atualização/remoção de usuários, funcionários e fornecedores |

### Erros

| Código | Significado |
|---|---|
| `400` | Campo obrigatório ausente ou payload inválido |
| `401` | Token ausente, inválido ou credenciais inválidas |
| `404` | Recurso não encontrado |
| `503` | Configuração de autenticação/banco indisponível |
| `500` | Erro interno do backend ou do Prisma |

### Formato das respostas

Por padrão, a API usa respostas JSON. Exemplos:

```json
{ "usuarios": [...] }
```

```json
{ "produto": { "id_produto": 1, "nome": "Produto" } }
```

```json
{ "mensagem": "Registro criado com sucesso.", "id_produto": 1 }
```

---

## Observações de negócio

- O login é feito apenas para usuários ativos (`usuarios.ativo = 1`).
- O cadastro de entradas e saídas pode atualizar o estoque conforme a lógica do banco.
- Os recursos são protegidos por JWT; não há controle de permissões por perfil neste backend.
- A API aceita JSON e formulário URL-encoded.
- Não há rota `PUT`; a atualização é feita por `PATCH`.

## Exemplo completo

```http
POST /login
Content-Type: application/json
```

```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

Resposta:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "usuario": {
    "id_usu": 1,
    "nome": "Usuário",
    "email": "usuario@exemplo.com",
    "ativo": 1
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

Depois:

```http
GET /produtos
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## Dica

Para manter a documentação fiel ao código, revise o arquivo `app.js` e as rotas em `route/` antes de alterar o contrato. O backend atual usa nomes de rotas e respostas que podem divergir de versões anteriores da API.
