# Plano de Implementação: [TÍTULO]

**Data:** [DATA]
**Autor:** Agente de Planejamento
**Status:** ⏳ Aguardando aprovação
**Fase do Roadmap:** [Fase X — Nome]

---

## 1. Contexto

### Problema / Motivação
> Descreva o problema ou a necessidade que motivou esta tarefa.

### Objetivo
> Descreva claramente o que será alcançado ao final da implementação.

### Documentos de Referência
- `PRODUCT.md` — [Seção relevante]
- `docs/legacy-modernization-spec.md` — [Seção relevante]
- `docs/tasks/fN-nome.md` — [Task correspondente]
- ADRs relacionados: `docs/ADRs/NNN-titulo.md`

---

## 2. Análise de Impacto

### Arquivos a Criar
| Arquivo | Descrição |
|---|---|
| `caminho/para/novo-arquivo.ts` | Descrição do propósito |

### Arquivos a Modificar
| Arquivo | Mudança |
|---|---|
| `caminho/para/arquivo-existente.ts` | Descrição da alteração |

### Arquivos a Excluir
| Arquivo | Justificativa |
|---|---|
| — | — |

### Dependências Externas (npm)
| Pacote | Versão | Justificativa |
|---|---|---|
| — | — | — |

### Migrações de Banco (Prisma)
> Descreva alterações no `schema.prisma`, se aplicável.

---

## 3. Design Técnico

### Visão Geral da Solução
> Diagrama ou descrição textual da solução proposta.

### Decisões de Design

#### Decisão 1: [Título]
| Alternativa | Prós | Contras |
|---|---|---|
| Opção A | ... | ... |
| Opção B | ... | ... |

**Decisão:** Opção [X]. **Justificativa:** ...

---

## 4. Passo a Passo de Implementação

> Instruções granulares para o agente de implementação. Cada passo deve ser
> atômico e verificável.

### Passo 1: [Título]
**Arquivo:** `caminho/para/arquivo.ts`
**Ação:** Criar / Modificar / Excluir

```typescript
// Pseudocódigo ou assinatura esperada
```

**Critério de conclusão:** [Como verificar que este passo está correto]

---

### Passo 2: [Título]
**Arquivo:** `caminho/para/arquivo.ts`
**Ação:** Criar / Modificar / Excluir

```typescript
// Pseudocódigo ou assinatura esperada
```

**Critério de conclusão:** [Como verificar que este passo está correto]

---

> _(Repetir para cada passo necessário)_

---

## 5. Conformidade com o Harness

### Verificação de Limites
| Arquivo | Linhas estimadas | Status |
|---|---|---|
| `arquivo.ts` | ~XX | ✅ ≤ 300 |

### Funções Longas
> Listar funções que se aproximam do limite de 30 linhas e propor extração
> se necessário.

---

## 6. Plano de Validação

### Testes Automatizados
- [ ] Teste unitário: [descrição]
- [ ] Teste de integração: [descrição]
- [ ] Teste E2E: [descrição]

### Validação Manual
- [ ] [Passo de verificação manual 1]
- [ ] [Passo de verificação manual 2]

### Comandos de Verificação
```bash
# Lint
cd backend && npm run lint
cd frontend && npm run lint

# Testes
cd backend && npm test

# Build
cd frontend && npm run build
```

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| [Descrição do risco] | Alta/Média/Baixa | Alto/Médio/Baixo | [Ação preventiva] |

---

## 8. Checklist de Entrega

- [ ] Todos os arquivos criados/modificados conforme especificado
- [ ] Lint passa sem erros (`npm run lint`)
- [ ] Nenhum arquivo excede 300 linhas
- [ ] Nenhuma função excede 30 linhas
- [ ] Testes passam (`npm test`)
- [ ] Migration do Prisma executada (se aplicável)
- [ ] ADR criado (se decisão arquitetural significativa)
- [ ] Commit segue Conventional Commits

---

## 9. Transição

> **Status após aprovação:** Pronto para execução pelo agente de implementação.
>
> ```
> → @implementation-agent Execute o plano em docs/plans/NNN-titulo.md
> ```
