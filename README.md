# imovil

Portal de imóveis: corretores cadastram e gerenciam imóveis num painel; o público navega, filtra e entra em contato.

| Workspace         | Papel                                                          |
| ----------------- | -------------------------------------------------------------- |
| `apps/web`        | Next.js — vitrine pública (`/imoveis`) e painel do corretor    |
| `packages/db`     | Schema, migrations (Drizzle) e queries do Postgres no Supabase |
| `packages/shared` | Tipos de domínio compartilhados (`Property`, …)                |
| `packages/lib`    | Utilitários operacionais                                       |

Design system e ferramental compartilhado vêm dos pacotes publicados do toolkit [`@cbrl/*`](https://github.com/kaycabral/toolkit) no npm: `@cbrl/design`, `@cbrl/env`, `@cbrl/pg`, `@cbrl/tsconfig`, `@cbrl/eslint-config`, `@cbrl/prettier-config`, `@cbrl/commitlint-config`, `@cbrl/testing`.

## Rodando local

```bash
pnpm install
pnpm --filter @imovil/web db:start   # stack Supabase local (Docker) + migrations
pnpm --filter @imovil/web db:env     # grava apps/web/.env.local
pnpm --filter @imovil/web db:seed
pnpm dev                             # http://localhost:3003
```

Regras de contribuição e gates em [`CLAUDE.md`](CLAUDE.md).
