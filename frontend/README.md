# Loja Oficial | Frontend

Interface administrativa React/Vite para a API descrita em `../API.md`. Para publicar os dois serviços no Render, consulte [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

## Executar

1. Em `frontend/`, instale as dependências com `npm install`.
2. Copie `.env.example` para `.env` para configurar a URL da API publicada ou de outra instância.
3. Execute `npm run dev` e abra a URL indicada pelo Vite. O servidor de desenvolvimento encaminha `/api` para a API configurada, evitando bloqueios de CORS do navegador.

Sem `VITE_API_URL`, o frontend usa `https://backend-wer5.onrender.com`. Para usar uma API local, configure `VITE_API_URL=http://localhost:5001` no `.env` do frontend. No build de produção, `VITE_API_URL` define o endereço chamado pelo navegador; o blueprint Render injeta a URL do serviço da API.

## Sessão

O login recebe um JWT da API e o mantém em `sessionStorage` até sair, fechar a aba ou o token expirar. As rotas CRUD exigem esse token. A API ainda não implementa papéis ou permissões por função.