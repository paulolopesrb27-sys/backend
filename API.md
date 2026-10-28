# API da Loja

## Objetivo

API REST para apoiar a operação de uma loja: cadastro e consulta de usuários, funcionários, fornecedores, clientes, produtos e categorias; controle de estoque; registro de entradas e saídas; e gerenciamento de pedidos e seus itens. Os dados são armazenados em MySQL/MariaDB.

## Tecnologias

- Node.js e Express
- MySQL/MariaDB, com pool de conexões
- JSON para envio e retorno dos dados
- bcryptjs para armazenar e validar hashes de senha
- CORS habilitado para todas as origens (`*`)

## Executar

Configure o arquivo `.env` na raiz do projeto:

```env
PORT=5001
DB_HOST=seu_host
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco
```

Instale as dependências e inicie o servidor:

```bash
npm install
npm start
```

O servidor usa a porta `5001` por padrão. A URL base local normalmente é `http://localhost:5001`.

## Formato das requisições

As rotas que recebem dados esperam `Content-Type: application/json`. IDs são enviados na URL. O cadastro e a atualização aceitam somente os campos configurados para cada recurso; campos desconhecidos são ignorados.

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

Retorna `200` e os dados públicos do usuário se as credenciais forem válidas e a conta estiver ativa. Senhas incorretas, usuário inexistente ou conta inativa retornam `401`; campos ausentes retornam `400`. A senha não é incluída na resposta.

Senhas novas são salvas com bcrypt. No primeiro login válido de contas legadas cuja senha ainda esteja em texto puro, a API atualiza o registro para bcrypt. O login atualmente **não emite JWT, cookie ou token de sessão**; ele apenas valida as credenciais e retorna os dados públicos do usuário.

## Recursos e endpoints

Os recursos abaixo possuem, em geral, as operações:

| Método | Caminho relativo | Ação |
|---|---|---|
| `GET` | `/recurso` | Lista registros |
| `GET` | `/recurso/:id` | Busca registro pela chave primária |
| `POST` | `/recurso` | Cria registro |
| `PATCH` | `/recurso/:id` | Atualiza parcialmente |
| `DELETE` | `/recurso/:id` | Remove registro |

Os caminhos `/recurso` são relativos à URL base. Para funcionários e fornecedores, os caminhos de tabela e os aliases singulares/plurais estão disponíveis. Para os demais recursos, veja os nomes listados abaixo.

| Tabela | Caminhos disponíveis | Chave |
|---|---|---|
| `usuarios` | `/usuario`, `/usuarios` | `id_usu` |
| `funcionarios` | `/funcionario`, `/funcionarios` | `id_funcionario` |
| `fornecedores` | `/fornecedor`, `/fornecedores` | `id_fornecedor` |
| `categorias` | `/categoria`, `/categorias` | `id_categoria` |
| `clientes` | `/cliente`, `/clientes` | `id_cliente` |
| `produtos` | `/produto`, `/produtos` | `id_produto` |
| `estoque` | `/estoque` | `id_estoque` |
| `entradas` | `/entrada`, `/entradas` | `id_entrada` |
| `saidas` | `/saida`, `/saidas` | `id_saida` |
| `pedidos` | `/pedido`, `/pedidos` | `id_pedido` |
| `pedido_itens` | `/pedido-item`, `/pedido_itens` | `id_item` |
| `historico_precos` | `/historico-preco`, `/historico_precos` | `id_historico` |
| `movimentacoes` | `/movimentacao`, `/movimentacoes` | `id_movimentacao` |
| `logs` | `/log`, `/logs` | `id_log` |

Em cada caminho, substitua `:id` pelo valor da chave correspondente. Exemplo: `GET /produtos/3`.

## Campos aceitos

Os campos abaixo são graváveis por `POST` e `PATCH`, exceto quando indicado. Chaves primárias e campos de data de criação/atualização gerenciados pelo banco não são enviados nos CRUDs genéricos.

| Recurso | Campos graváveis | Obrigatórios no POST |
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
| Funcionários | `nome`, `cargo`, `salario`, `telefone`, `email`, `data_admissao`, `ativo` | A rota recebe esses campos; nome, cargo e salário são exigidos pelo banco |
| Fornecedores | `nome`, `empresa`, `email`, `telefone`, `cidade`, `estado`, `ativo` | A rota recebe esses campos; nome é exigido pelo banco |
| Usuários | `nome`, `email`, `senha`, `contato`, `genero`, `ativo` | A rota exige `senha`; nome e e-mail são exigidos pelo banco |

Valores possíveis de `movimentacoes.tipo`, conforme o banco: `E`, `S`, `A`, `P` ou `T`.

## Regras de negócio relevantes

- O cadastro de uma entrada atualiza o estoque pelo trigger configurado no banco.
- O cadastro de uma saída reduz o estoque pelo trigger configurado no banco.
- Alterar ou remover uma entrada/saída atualiza o estoque na mesma transação da operação.
- O estoque possui uma linha por produto, devido à restrição única em `estoque.id_produto`.
- Não existe rota de login para funcionários: o login implementado é para registros da tabela `usuarios`.
- As rotas não possuem middleware de autorização; ter feito login não restringe automaticamente o acesso às demais operações.

## Respostas e erros

- `200`: consulta ou atualização concluída.
- `201`: registro criado.
- `202`: atualização ou remoção em algumas rotas específicas, como usuários, funcionários e fornecedores.
- `400`: campos obrigatórios ausentes, corpo inválido ou nenhum campo permitido para atualizar.
- `401`: credenciais de login inválidas ou conta inativa.
- `404`: registro não encontrado.
- `500`: erro de conexão ou execução no banco.

As respostas de consulta geralmente agrupam os dados pelo nome da tabela, por exemplo `{ "produtos": [...] }` ou `{ "produtos": { ... } }`. As mensagens e os formatos de resposta podem variar entre as rotas próprias de usuários/funcionários/fornecedores e os CRUDs genéricos.
