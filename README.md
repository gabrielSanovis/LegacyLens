# LegacyLens

O **LegacyLens** é uma plataforma de modernização de sistemas legados. Ele atua como um assistente inteligente, ajudando equipes de engenharia a compreender, analisar e modernizar bases de código complexas (como grandes monólitos corporativos).

O sistema mapeia a estrutura do código legado em um **Knowledge Graph**, cria embeddings semânticos dos arquivos e fornece um **Chat com RAG (Retrieval-Augmented Generation)** para que os desenvolvedores possam fazer perguntas arquiteturais complexas ("Quais reducers são afetados se eu mudar essa Saga?").

## 🏗 Arquitetura

O LegacyLens é um monorepo composto por dois projetos principais:

- **Backend (`/backend`)**: API construída em **NestJS** (TypeScript). Responsável por orquestrar a ingestão de código, gerenciar os agentes de IA (LangGraph/LangChain) e servir a interface de usuário. Utiliza **Prisma** para persistência relacional.
- **Frontend (`/frontend`)**: SPA construída com **React** e **Vite** (TypeScript). Interface moderna estilo "Glassmorphism" para interação com os assistentes de modernização.

### Stack Tecnológica
- **Linguagem**: TypeScript (em toda a stack)
- **Frontend**: React, Vite, CSS Modules
- **Backend**: NestJS, Prisma ORM
- **Banco de Dados (Relacional)**: PostgreSQL (via Prisma)
- **Knowledge Graph**: Neo4j
- **Vector Store**: Qdrant
- **Filas & Cache**: Redis / BullMQ

---

## 🚀 Como iniciar o projeto localmente

### 1. Requisitos
- Node.js (v20+)
- NPM
- Docker e Docker Compose

### 2. Subindo a infraestrutura base
O projeto necessita do PostgreSQL, Neo4j, Qdrant e Redis rodando.
Na raiz do projeto, execute:
```bash
docker-compose up -d
```

### 3. Configuração do Backend
Entre na pasta `backend`:
```bash
cd backend
```
Siga as instruções no [README do Backend](./backend/README.md) para instalar dependências, configurar o `.env`, rodar as migrations do banco e iniciar o servidor de desenvolvimento.

### 4. Configuração do Frontend
Em outro terminal, entre na pasta `frontend`:
```bash
cd frontend
```
Siga as instruções no [README do Frontend](./frontend/README.md) para instalar as dependências e iniciar o servidor Vite.

---

## 🛠 Ferramentas de Desenvolvimento (Harness)

Este projeto implementa scripts de Harness para garantir a qualidade do código e padronizar o desenvolvimento.

### Feedback (Restrições de Qualidade)
Usamos **ESLint** e **Lefthook** para validar o código no momento do commit.
Regras principais ativas:
- **Limite de linhas por arquivo**: 300 linhas.
- **Limite de linhas por função**: 30 linhas.

O Lefthook (`lefthook.yml`) garante que arquivos `.ts` ou `.tsx` modificados passem por essa validação antes do commit ser aceito.

### Feedforward (Geração de Código Boilerplate)
Usamos **Plop.js** para gerar estruturas padronizadas de código. A partir da raiz do projeto, você pode usar os scripts:

- Gerar uma nova Feature no Backend (Clean Architecture):
  ```bash
  npm run generate:backend
  ```
- Gerar um novo Componente no Frontend:
  ```bash
  npm run generate:component
  ```
