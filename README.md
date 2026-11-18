# imovil

Portal de imóveis: corretores cadastram e gerenciam imóveis num painel; o público navega, filtra e entra em contato.

| Workspace         | Papel                                                          |
| ----------------- | -------------------------------------------------------------- |
| `apps/web`        | Next.js — vitrine pública (`/imoveis`) e painel do corretor    |
| `packages/db`     | Schema, migrations (Drizzle) e queries do Postgres no Supabase |
| `packages/shared` | Tipos de domínio compartilhados (`Property`, …)                |
| `packages/lib`    | Utilitários operacionais                                       |
| `packages/design` | Design system (tokens + componentes shadcn/Radix)              |
| `packages/env`    | Helpers de leitura de env (fail-fast)                          |

Ferramental compartilhado: `packages/tsconfig`, `packages/eslint-config`, `packages/testing`.

## Rodando local

```bash
pnpm install
pnpm --filter @imovil/web db:start   # stack Supabase local (Docker) + migrations
pnpm --filter @imovil/web db:env     # grava apps/web/.env.local
pnpm --filter @imovil/web db:seed
pnpm dev                             # http://localhost:3003
```

Regras de contribuição e gates em [`CLAUDE.md`](CLAUDE.md).
