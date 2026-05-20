# Arquitetura do LegacyLens

## Visão Geral

O LegacyLens é uma plataforma de modernização de sistemas legados estruturada como um **monorepo** com dois projetos principais: um **backend** em NestJS e um **frontend** em React + Vite. Toda a stack utiliza **TypeScript** como linguagem unificada.

A arquitetura é orientada por um **pipeline de ingestão de código** que transforma repositórios legados em conhecimento estruturado (Knowledge Graph + embeddings vetoriais), sobre o qual são construídas funcionalidades de compreensão via IA (GraphRAG + LLM).

---

## Diagrama de Camadas

```
┌─────────────────────────────────────────────────┐
│           Frontend (React + Vite)                │
│   Login · Projetos · Dashboard · Configurações   │
├─────────────────────────────────────────────────┤
│           Backend API (NestJS)                   │
│   Auth · Project · Settings · Ingestion          │
├─────────────────────────────────────────────────┤
│           Pipeline de Ingestão                   │
│   Parser (Tree-sitter) → Extrator de Edges →     │
│   Graph Loader (Neo4j) → Chunker → Embeddings   │
├─────────────────────────────────────────────────┤
│           Infraestrutura                         │
│   PostgreSQL · Neo4j · Qdrant · Redis/BullMQ     │
└─────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

| Componente | Tecnologia | Função |
|---|---|---|
| **Linguagem** | TypeScript | Stack unificada (frontend + backend) |
| **Frontend** | React 19, Vite 8, CSS Modules | SPA com estilo glassmorphism |
| **Backend** | NestJS 11, Prisma ORM 7 | API REST com Clean Architecture |
| **Banco Relacional** | PostgreSQL 16 | Persistência de usuários, projetos, conversas |
| **Knowledge Graph** | Neo4j 5 | Grafo de sagas, reducers, actions e seus relacionamentos |
| **Vector Store** | Qdrant | Embeddings semânticos dos chunks de código |
| **Filas** | Redis 7 + BullMQ | Processamento assíncrono de jobs de ingestão |
| **IA / LLM** | LangChain + OpenAI | Geração de embeddings e compreensão de código |
| **Parser** | Tree-sitter (WASM) | Parsing de ASTs para JS/TS |

---

## Estrutura do Backend

O backend segue uma organização inspirada em **Clean Architecture**, dividida em camadas:

```
backend/src/
├── api/v1/              # Camada de apresentação (Controllers + Services)
│   ├── project/         #   CRUD de projetos + disparo de ingestão
│   └── settings/        #   Configurações do sistema (provider LLM, API key)
├── auth/                # Autenticação JWT (Passport + bcrypt)
├── domain/entities/     # Entidades de domínio
├── infra/               # Camada de infraestrutura
│   ├── database/        #   Prisma (PostgreSQL)
│   ├── graph/           #   Neo4j Service
│   ├── llm/             #   Embedding Service (LangChain/OpenAI)
│   ├── queue/           #   BullMQ (Redis)
│   └── vector/          #   Qdrant Service
└── ingestion/           # Pipeline de ingestão de código
    ├── parser/          #   ParserService (Tree-sitter WASM)
    ├── extractors/      #   EdgeExtractor + TypeResolver
    ├── chunker/         #   Chunking semântico por saga/reducer/selector
    └── loaders/         #   GraphLoader (Neo4j) + VectorLoader (Qdrant)
```

### Pipeline de Ingestão

O coração do sistema é o `PipelineService`, que executa a seguinte sequência:

1. **Walk** — Varre recursivamente o diretório do projeto buscando arquivos `.js` e `.ts`
2. **Parse** — Gera ASTs via Tree-sitter (WASM) para cada arquivo
3. **Extract** — Extrai nós (Sagas, Reducers, Actions, Selectors) e edges (WATCHES, DISPATCHES, CALLS, SELECTS)
4. **Resolve Types** — Usa o compilador TypeScript (`ts.createProgram`) para resolução avançada de tipos de Action
5. **Load Graph** — Persiste o grafo extraído no Neo4j
6. **Chunk & Embed** — Cria chunks semânticos e gera embeddings vetoriais no Qdrant

Jobs de ingestão são processados de forma assíncrona via **BullMQ**. O `IngestionProcessor` clona repositórios remotos (via `git clone --depth 1`), executa o pipeline e limpa os dados temporários.

### Modelo de Dados (Prisma)

Os modelos principais são: `User`, `Project`, `IngestionJob`, `Conversation`, `Message`, `Artifact` e `SystemSetting`. O schema mapeia o fluxo completo desde a criação de projetos até o histórico de conversas com o assistente de IA.

---

## Estrutura do Frontend

```
frontend/src/
├── pages/               # Páginas da aplicação
│   ├── Login            #   Autenticação (email + senha → JWT)
│   ├── Projects         #   Listagem e criação de projetos
│   ├── ProjectDetail    #   Detalhes + disparo de ingestão
│   └── Settings         #   Configuração do provedor LLM
├── services/api.ts      # Cliente HTTP centralizado (fetch + Bearer token)
├── App.tsx              # Roteamento (react-router-dom)
└── main.tsx             # Entry point
```

O frontend utiliza **CSS Modules** para estilização isolada e `react-router-dom` para navegação SPA. A comunicação com o backend é feita via `apiFetch`, um wrapper genérico sobre `fetch` que injeta automaticamente o JWT do `localStorage`.

---

## Infraestrutura (Docker Compose)

Todos os serviços de infraestrutura são orquestrados via `docker-compose.yml`:

| Serviço | Porta | Função |
|---|---|---|
| PostgreSQL 16 | 5433 | Banco relacional (Prisma) |
| Neo4j 5 | 7474 / 7687 | Knowledge Graph (HTTP + Bolt) |
| Qdrant | 6333 / 6334 | Vector Store (REST + gRPC) |
| Redis 7 | 6379 | Filas BullMQ |

---

## Ferramentas de Desenvolvimento

- **Lefthook** — Git hooks no pre-commit executando ESLint em arquivos `.ts/.tsx` modificados
- **Plop.js** — Geradores de código boilerplate (`npm run generate:backend` / `npm run generate:component`)
- **ESLint** — Regras customizadas incluindo limites de 300 linhas por arquivo e 30 linhas por função
- **Prettier** — Formatação automática no backend
- **Jest** — Framework de testes (backend)
