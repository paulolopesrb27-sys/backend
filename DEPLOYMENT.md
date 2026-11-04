# Publicação

O arquivo `render.yaml` define dois serviços no Render: uma API Node e o frontend estático. O banco MySQL/MariaDB é externo e não está incluído no blueprint.

## Pré-requisitos

- Uma instância MySQL/MariaDB acessível pela internet, com o schema da aplicação criado.
- Credenciais de banco restritas ao schema da loja e acesso de rede limitado aos endereços de saída do serviço Render.
- Uma conta Render com acesso ao repositório GitHub.

Não importe o dump de desenvolvimento diretamente para produção: ele contém dados pessoais de exemplo. Prepare um banco de produção sem esses registros e aplique apenas o schema e as migrações necessárias.

## Implantar

1. Envie o repositório para o GitHub e, no Render, crie um Blueprint apontando para esse repositório.
2. No serviço `loja-api`, informe `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` do MySQL/MariaDB de produção. Crie um usuário de banco restrito ao schema da aplicação e habilite TLS (`DB_SSL=true`) quando suportado pelo provedor.
3. Configure a regra de rede/firewall do banco para aceitar conexões do serviço hospedado. Restrinja-a aos IPs de saída estáticos do Render quando disponíveis no plano; caso contrário, siga a política de rede do provedor e exija credenciais fortes e TLS. O banco deve aceitar conexões TCP externas na porta configurada em `DB_PORT`.
4. O blueprint gera `JWT_SECRET` automaticamente e referencia o endereço público HTTPS entre frontend e API. `FRONTEND_ORIGIN` limita o CORS ao domínio público do frontend; não use `*` em produção.
5. Confirme a criação dos serviços `loja-api` e `loja-frontend` e aguarde os deploys. A instalação gera o Prisma Client sem aplicar migrações ao banco.
6. Confirme `GET https://<domínio-da-api>/health` com status `200` e `database: ok`. Cadastre uma conta ativa na tabela `usuarios` do banco de produção; a tela de login não oferece cadastro público.
7. Abra o domínio HTTPS apresentado pelo serviço `loja-frontend` e teste o login. O frontend usa o endereço público da API referenciado pelo Blueprint.

O endpoint `/health` verifica o processo HTTP e a conectividade MySQL/MariaDB por meio do Prisma. O serviço do banco é externo ao Blueprint e precisa ser provisionado e liberado pelo seu provedor.

## Operação e segurança

- Todas as rotas CRUD exigem um JWT emitido pelo login. O token expira em oito horas e é guardado apenas na sessão da aba do navegador.
- A chave JWT invalida todas as sessões existentes quando for trocada; faça rotação se houver suspeita de exposição.
- O frontend e a API são serviços separados. O Render pode suspender serviços gratuitos sem tráfego; isso pode causar atraso na primeira requisição.
- Configure backup, TLS e allowlist de rede no serviço MySQL conforme os recursos do provedor. Nunca exponha a porta do banco sem controles de acesso.
- As contas de usuário têm acesso às operações CRUD; a API ainda não implementa papéis/permissões por função.