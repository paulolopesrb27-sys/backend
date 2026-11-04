# Loja Oficial | Frontend

Interface administrativa React/Vite para a API descrita em `../API.md`. Para publicar os dois serviços no Render, consulte [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

## Executar

1. Inicie o backend na raiz do repositório com `npm start` (porta padrão `5001`).
2. Em `frontend/`, instale as dependências com `npm install`.
3. Copie `.env.example` para `.env` se a API usar outra URL.
4. Execute `npm run dev` e abra a URL indicada pelo Vite.

Sem `VITE_API_URL`, o frontend usa `http://localhost:5001`.

## Sessão

O login recebe um JWT da API e o mantém em `sessionStorage` até sair, fechar a aba ou o token expirar. As rotas CRUD exigem esse token. A API ainda não implementa papéis ou permissões por função.