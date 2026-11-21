# imovil

Portal de imóveis: corretores cadastram e gerenciam imóveis num painel; o público navega, filtra e entra em contato.

Um app Next.js na raiz do repo (sem workspaces):

| Caminho              | Papel                                                          |
| -------------------- | -------------------------------------------------------------- |
| `src/`               | Next.js — vitrine pública (`/imoveis`) e painel do corretor    |
| `src/db`, `drizzle/` | Schema, migrations (Drizzle) e queries do Postgres no Supabase |
| `src/shared`         | Tipos de domínio e schemas zod (`Property`, …)                 |

Design system e ferramental compartilhado vêm dos pacotes publicados do toolkit [`@cbrl/*`](https://github.com/kaycabral/toolkit) no npm: `@cbrl/design`, `@cbrl/env`, `@cbrl/pg`, `@cbrl/supabase`, `@cbrl/next`, `@cbrl/log`, `@cbrl/br`, `@cbrl/tsconfig`, `@cbrl/eslint-config`, `@cbrl/prettier-config`, `@cbrl/commitlint-config`, `@cbrl/testing`.

## Rodando local

```bash
pnpm install
pnpm db:start   # stack Supabase local (Docker) + migrations
pnpm db:env     # grava .env.local
pnpm db:seed
pnpm dev        # http://localhost:3003
```

Regras de contribuição e gates em [`CLAUDE.md`](CLAUDE.md).
