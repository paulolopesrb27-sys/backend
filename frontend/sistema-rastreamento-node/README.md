# 🚀 Sistema de Rastreio Incrível do Paulo (Node.js + Leaflet.js + PDFKit)

Projeto 100% em **Node.js** pronto para ser aberto diretamente no Visual Studio Code.

---

## 📁 Estrutura da Pasta

```text
sistema-rastreamento-node/
├── public/                 # Frontend completo (HTML5, CSS3, JS Vanilla, Leaflet.js)
│   ├── index.html          # Tela de busca com atalho para Araguaína - TO
│   ├── style.css           # Estilização moderna e responsiva
│   └── app.js              # Mapa interativo com Leaflet e consumo da API
├── .vscode/
│   └── launch.json         # Configuração de Execução (F5) para o VS Code
├── package.json            # Dependências (Express, CORS, PDFKit)
├── server.js               # API REST em Node.js com rota de PDF oficial
└── README.md
```

---

## ⚡ Como Rodar no VS Code

### Opção 1: Pelo Terminal
```bash
# Iniciar o servidor
npm start

# Ou com auto-reload nas alterações:
npm run dev
```

### Opção 2: Pelo Botão do VS Code
Pressione a tecla **`F5`** no VS Code para iniciar com o depurador integrado.

---

## 🌐 Acesso no Navegador

- **Interface do Sistema com Mapa Leaflet:**  
  👉 [http://localhost:3000](http://localhost:3000)

- **Consulta da Encomenda de Araguaína (Beatriz Freitas):**  
  👉 [http://localhost:3000/api/entregas/paulomrsenai67](http://localhost:3000/api/entregas/paulomrsenai67)

- **Comprovante Oficial em PDF:**  
  👉 [http://localhost:3000/api/entregas/paulomrsenai67/comprovante](http://localhost:3000/api/entregas/paulomrsenai67/comprovante)
