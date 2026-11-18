# packages/shared — Shared Package (@imovil/shared)

## Escopo

Compartilhado por todos os workspaces. Mudanças aqui afetam qualquer app que importe `@imovil/shared` — verifique compatibilidade antes de alterar exports existentes.

## Regras

- Tipos novos aqui somente quando usados em 2+ workspaces. Se for só um workspace, mantenha lá dentro.
- Exportar apenas via `src/index.ts` — sem re-exports entre módulos (`types.ts` ou similar)
- Sem lógica de negócio, sem dependências externas (manter 100% puro)

## ⚠️ Mudança de tipo → atualizar schema

Se um tipo aqui mapeia para uma tabela do Postgres (`Property` → `properties`), qualquer mudança (adicionar/remover/renomear campo, mudar nullability) **exige a mudança correspondente em `packages/db/src/schema.ts` + migration nova (`db:generate`) na mesma MR**, e o ajuste do mapeamento em `queries/properties.ts`.

Convenção: tipos em `camelCase` no TypeScript; colunas em `snake_case` no Postgres (o schema Drizzle faz o mapeamento). Datas chegam como ISO string nos tipos de domínio.
