# LegacyLens Frontend

Interface do usuário (SPA) construída com **React**, **TypeScript** e **Vite**.

Fornece painéis administrativos para gerenciamento de projetos legados e uma interface imersiva de chat para consultar a arquitetura através da IA.

## 🎨 Arquitetura de UI e UX
- **Estilo**: "Glassmorphism" com tons de roxo sobre fundos escuros (Dark Theme).
- **Roteamento**: React Router v6.
- **Requisições API**: Cliente de `fetch` customizado (ver `src/services/api.ts`) que injeta automaticamente o token JWT.

## ⚙️ Configuração Local

1. Instale as dependências:
```bash
npm install
```

2. Executando o projeto:
```bash
npm run dev
```

O projeto Vite iniciará o servidor de desenvolvimento, geralmente acessível em `http://localhost:5173`.

## 📁 Estrutura de Pastas

- `src/components/`: Componentes reutilizáveis de interface. O `Plop.js` deve ser utilizado para gerar novos componentes aqui (ver README na raiz).
- `src/pages/`: Páginas e Views mapeadas nas rotas do React Router (ex: Login, Projects).
- `src/services/`: Clientes REST, hooks de consumo de dados e integrações com o backend.
- `src/index.css`: Definições globais de estilos (CSS Reset, Variáveis de tipografia e cores).
