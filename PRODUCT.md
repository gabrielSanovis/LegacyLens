# Produto — LegacyLens

## O Problema

Sistemas legados em JavaScript/TypeScript — especialmente grandes aplicações frontend baseadas em **Redux Saga** — acumulam anos de regras de negócio críticas embutidas em código que ninguém mais entende completamente. A lógica está espalhada por centenas de sagas, reducers e selectors interdependentes, sem documentação, com efeitos colaterais implícitos e fluxos assíncronos que só o autor original conhecia.

Modernizar ou refatorar esses sistemas custa caro e demora — não pela complexidade da nova tecnologia, mas porque **ninguém sabe o que o sistema atual realmente faz**.

---

## A Solução

**LegacyLens** é uma plataforma de inteligência sobre código legado. Ela ingere qualquer base de código, constrói um **Knowledge Graph** estruturado sobre ela, e expõe esse conhecimento via **interface conversacional** e visual — permitindo que times de modernização entendam o sistema em dias, não meses.

O produto não substitui o desenvolvedor. Ele **elimina o gargalo de entendimento** que trava qualquer projeto de modernização.

---

## Para Quem

| Persona | Problema | O que o LegacyLens entrega |
|---|---|---|
| **Tech Lead / Arquiteto** | Não sabe o que pode quebrar ao mudar um módulo | Mapa de dependências e análise de impacto |
| **Business Analyst** | Não consegue extrair regras de negócio do código | Documentação gerada automaticamente em linguagem natural |
| **Engenheiro novo no projeto** | Leva semanas para entender o sistema | Chat em linguagem natural sobre qualquer parte do código |
| **Gestor de TI** | Não sabe o tamanho real do problema | Dashboard de complexidade e riscos |

---

## Funcionalidades Implementadas

### 🔐 Autenticação

- Login com **email e senha**
- Autenticação via **JWT** (JSON Web Tokens)
- Proteção de rotas com guards (Passport.js)
- Roles de usuário (padrão: `user`)

### 📁 Gestão de Projetos

- **Criação** de projetos com nome e URL do repositório Git
- **Listagem** de projetos do usuário
- **Detalhes** do projeto com informações de status
- **Disparo de ingestão** — clona o repositório e inicia análise automatizada
- **Exclusão** de projetos (cascade em todos os dados relacionados)

### ⚙️ Pipeline de Ingestão de Código

O pipeline é o coração do LegacyLens. Ao disparar uma ingestão, o sistema executa automaticamente:

1. **Clone** do repositório Git (shallow clone)
2. **Parsing** de todos os arquivos JS/TS via Tree-sitter
3. **Extração** de entidades:
   - **Sagas** — watchers e workers do Redux Saga
   - **Reducers** — cases e state handlers
   - **Actions** — action types e action creators
   - **Selectors** — funções de seleção do estado
4. **Mapeamento de relacionamentos**:
   - `WATCHES` — qual saga escuta qual action
   - `DISPATCHES` — qual saga dispara qual action
   - `CALLS` — quais sagas chamam outras sagas
   - `SELECTS` — quais sagas usam quais selectors
5. **Resolução de tipos** TypeScript para actions complexas
6. **Construção do Knowledge Graph** no Neo4j
7. **Geração de embeddings** semânticos para busca vetorial (Qdrant)

O processamento é **assíncrono** (via filas BullMQ/Redis) e não bloqueia a interface.

### 🛠️ Configurações do Sistema

- Configuração do **provedor de LLM** (ex: OpenRouter)
- Configuração da **API key** e **nome do modelo**
- Persistência global das configurações

### 🖥️ Interface do Usuário

A interface é uma SPA (Single Page Application) com design **glassmorphism**, composta pelas seguintes telas:

- **Login** — Formulário de autenticação
- **Projetos** — Listagem em cards, criação de novos projetos
- **Detalhes do Projeto** — Informações, status da ingestão, ações
- **Configurações** — Ajustes de LLM e preferências

---

## Funcionalidades Planejadas (Roadmap)

### Fase 1 — MVP (em andamento)

- [ ] Chat conversacional com **GraphRAG** (busca vetorial + traversal no grafo)
- [ ] Dashboard visual de fluxo de actions (D3.js)
- [ ] Geração automática de documentação por saga/reducer
- [ ] Score de confiança por artefato (High / Medium / Low)
- [ ] Exportação para Markdown e Confluence

### Fase 2 — Expansão

- [ ] Suporte a MobX, Zustand, XState e Redux Observable
- [ ] GraphRAG multi-hop (2-3 hops)
- [ ] Análise de componentes React conectados ao store
- [ ] Capability map (agrupamento automático por domínio de negócio)
- [ ] Integração com Jira

### Fase 3 — Modernização Assistida

- [ ] Sugestões de migração para React Query / Zustand
- [ ] Geração de testes de caracterização para sagas
- [ ] Suporte a COBOL e Java legado
- [ ] Rastreabilidade bidirecional: novo código ↔ saga legada

---

## Métricas de Sucesso (MVP)

| Métrica | Meta |
|---|---|
| Tempo de ingestão (base 500k LOC) | < 30 minutos |
| Precisão da documentação gerada | ≥ 80% |
| Cobertura de módulos documentados | ≥ 90% |
| Rastreabilidade artefato → código | 100% |

---

## Segurança e Privacidade

- **Deploy on-premises** via Docker Compose, sem dependência de nuvem
- Suporte planejado a **modelos LLM locais** (Ollama) para clientes com restrição de dados
- Nenhum código sai da infraestrutura do cliente sem consentimento
- Autenticação JWT no MVP; SSO via SAML/OIDC planejado para v2
