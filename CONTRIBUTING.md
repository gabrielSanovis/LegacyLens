# Guia de Contribuição — LegacyLens

## Configuração do Ambiente

**Requisitos:** Node.js v20+, NPM e Docker/Docker Compose.

```bash
# 1. Suba a infraestrutura (PostgreSQL, Neo4j, Qdrant, Redis)
docker-compose up -d

# 2. Backend — instale dependências, configure o .env e rode as migrations
cd backend
npm install
cp .env.example .env   # preencha as variáveis
npx prisma migrate dev
npm run start:dev

# 3. Frontend — em outro terminal
cd frontend
npm install
npm run dev
```

---

## Padrões de Código

### Regras ESLint obrigatórias

| Regra | Limite |
|---|---|
| Máximo de linhas por arquivo | **300** (excluindo linhas em branco e comentários) |
| Máximo de linhas por função | **30** (excluindo linhas em branco e comentários) |

O **Lefthook** executa o ESLint automaticamente no `pre-commit` para todos os arquivos `.ts` e `.tsx` modificados. Commits que violam essas regras serão **bloqueados**.

### Convenções

- **TypeScript** em toda a stack — nunca use `any` desnecessariamente
- **Backend:** Prettier ativo com formatação automática; use `npm run format` antes de commitar
- **Frontend:** CSS Modules para estilização (`.module.css`) — nunca estilos globais inline
- **Nomes de commits:** siga o padrão [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, etc.)

---

## Geradores de Código (Plop.js)

Use os geradores para manter a padronização:

```bash
# Nova feature no backend (entity, use-case, controller, service, module)
npm run generate:backend

# Novo componente React (componente + CSS Module + barrel export)
npm run generate:component
```

### Estrutura gerada — Backend (Clean Architecture)

```
backend/src/
├── domain/entities/        {nome}.entity.ts
├── domain/use-cases/{nome}/ create-{nome}.use-case.ts
└── api/v1/{nome}/          {nome}.controller.ts
                            {nome}.service.ts
                            {nome}.module.ts
```

### Estrutura gerada — Frontend

```
frontend/src/components/{Nome}/
├── {Nome}.tsx
├── {Nome}.module.css
└── index.ts
```

---

## Fluxo de Trabalho

1. Crie uma **branch** a partir de `main` com nome descritivo (`feat/chat-interface`, `fix/ingestion-timeout`)
2. Faça commits pequenos e frequentes seguindo Conventional Commits
3. Garanta que o **lint passa** localmente antes de abrir o PR (`npm run lint` em `/backend` e `/frontend`)
4. Abra um **Pull Request** com descrição clara do que foi alterado e por quê
5. Aguarde **code review** antes do merge

---

## Dicas

- Consulte a documentação em `docs/` para entender a especificação completa do produto e as ADRs (Architecture Decision Records)
- Para testes no backend: `cd backend && npm test`
- Para build de produção do frontend: `cd frontend && npm run build`
- Em caso de dúvidas sobre a arquitetura, consulte o `ARCHITECTURE.md` na raiz do projeto
