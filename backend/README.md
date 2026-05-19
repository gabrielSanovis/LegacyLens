# LegacyLens Backend

API RESTful construída em **NestJS** para orquestrar o processo de ingestão de código legado e disponibilizar as interfaces do assistente de inteligência artificial (LangChain/LangGraph).

O backend segue conceitos de Clean Architecture de forma simplificada, dividindo as responsabilidades em `domain`, `api` (controllers/services) e `infra` (database).

## 💻 Requisitos
- Node.js (v20+)
- Infraestrutura base rodando via Docker Compose (veja o README na raiz do projeto).

## ⚙️ Configuração Local

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente baseadas no `.env.example` (ou crie um arquivo `.env`):
```env
DATABASE_URL="postgresql://legacylens:legacylens@localhost:5433/legacylens?schema=public"
JWT_SECRET="legacylens-dev-secret-change-in-production"
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="legacylens"
QDRANT_URL="http://localhost:6333"
REDIS_URL="redis://localhost:6379"
```

3. Inicialize o banco de dados via Prisma:
Aplica as migrations no banco e gera o Prisma Client.
```bash
npx prisma migrate dev --name init
```

## 🚀 Executando o servidor

```bash
# modo de desenvolvimento local
npm run start:dev

# modo de produção
npm run build
npm run start:prod
```
A API ficará disponível em `http://localhost:3000`.

## 📦 Estrutura do Banco de Dados
Utilizamos o **Prisma ORM**.
O Prisma está configurado para o padrão v7, utilizando o `adapter-pg` e forçando a compilação em `CommonJS` (`cjs`) para manter a total compatibilidade com os módulos do NestJS.
O banco roda na porta `5433` para evitar conflitos com instalações nativas locais do PostgreSQL na porta `5432`.

As definições de schema encontram-se em `prisma/schema.prisma`.
Após alterações no schema, lembre-se de rodar `npx prisma migrate dev` para aplicar as modificações e regenerar os tipos TypeScript.

## 🔑 Autenticação
Endpoints sob rotas sensíveis devem ser protegidos com o `JwtAuthGuard`. 
A emissão do token Bearer acontece no endpoint `/api/v1/auth/login`.
