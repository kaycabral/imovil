# packages/shared — Shared Package (@tekoa/shared)

## Escopo

Compartilhado por todos os workspaces. Mudanças aqui afetam qualquer app que importe `@tekoa/shared` — verifique compatibilidade antes de alterar exports existentes.

## Regras

- Tipos novos aqui somente quando usados em 2+ workspaces. Se for só um workspace, mantenha lá dentro.
- Exportar apenas via `src/index.ts` — sem re-exports entre módulos (`types.ts` ou similar)
- Sem lógica de negócio, sem dependências externas (manter 100% puro)

## ⚠️ Mudança de tipo → atualizar rules

Se um tipo aqui mapeia para uma coleção do Firestore, qualquer mudança (adicionar/remover/renomear campo, mudar nullability) **exige atualização correspondente em `firestore.rules` na mesma PR** — e em `firestore.indexes.json` se a mudança introduzir uma nova query. Sem isso, as rules e os tipos divergem em produção.

Convenção: tipos espelham os docs em `camelCase` no TypeScript e no Firestore (Firestore não força snake_case). Datas são `Timestamp` no Firestore — converter para `Date`/string ISO no boundary do consumidor (preferir tipos de domínio sem `Timestamp` aqui, e fazer o mapeamento no adapter).
