# imovil

Portal de imóveis: Next.js (`apps/web`) com Supabase (Postgres, Auth e Storage).

Cada workspace (`apps/*`, `packages/*`) tem `CLAUDE.md` próprio com escopo e regras locais — abra antes de editar arquivos dentro dele.

## Regras invioláveis

1. **Next.js: leia a doc local antes de codar.** `node_modules/next/dist/docs/` é a fonte de verdade; o conhecimento de treino está defasado.
2. **pnpm apenas.** Nunca `npm`/`yarn`/`bun`. Versões compartilhadas vivem no `catalog` do `pnpm-workspace.yaml` — bump = 1 linha + `pnpm install`.
3. **Aliases.** `@/...` dentro do workspace, `@imovil/<pkg>` entre workspaces. Nunca `../../`.
4. **Codebase em inglês.** Identificadores, comentários, mensagens de erro, logs, nomes de eventos.
5. **ESLint: nunca desabilitar.** Sem `eslint-disable*`. Dívida antiga vive no `eslint-suppressions.json` de cada workspace (catraca: violação nova falha).
6. **Tipagem sem escape hatches.** Sem `any`, `as any`, `as unknown as X`, `@ts-ignore`.
7. **Primitivos UI vêm do `@cbrl/design`** (shadcn sobre Radix). Não copiar componente pro app.
8. **Sem merge sem evidência de execução real** (spec E2E, log de `pnpm test` cobrindo o caminho, ou smoke manual descrito no PR).

## Gates

```bash
pnpm format:check
pnpm lint        # eslint por workspace (turbo)
pnpm typecheck
pnpm test        # vitest por workspace
pnpm build
```

Ambiente local (stack Supabase via Docker): `pnpm --filter @imovil/web db:start` → `db:env` → `db:seed` → `pnpm dev` (porta 3003). Suíte Postgres do `@imovil/db`: `POSTGRES_URL=<stack local> pnpm --filter @imovil/db test:integration:pg`.

## Não-óbvio

- **Deploy**: Vercel (Root Directory `apps/web`), Postgres/Auth/Storage no Supabase. Envs na Vercel: `POSTGRES_URL` (pooler de transação, injetada pela integração Supabase ↔ Vercel), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, flags `IMOVIL_FEATURE_*`. **Migrations em produção só pelo CI** (job `migrate-production` no merge pra `main`); ninguém roda migrate contra prod da própria máquina. Regras (expand → contract, imutabilidade) e runbook em [`docs/production.md`](docs/production.md).
- **turbo em modo estrito** corta envs no build: toda env lida no build entra no `passThroughEnv` de `apps/web/turbo.json`.
- **Origem**: extraído do monorepo `cbrl` em 2026-11-17 com histórico (`git filter-repo`; `apps/imovil`→`apps/web`, `packages/imovil/*`→`packages/*`). Design system, ferramental e infra comum (`@cbrl/{design,env,pg,supabase,next,log,br,tsconfig,eslint-config,prettier-config,commitlint-config,testing}`) vêm dos pacotes publicados no npm (fonte: repo `kaycabral/toolkit`); mudança neles é feita lá e entra aqui por bump de versão. O `@imovil/db` usa o Drizzle do `@cbrl/pg` (só modo password, CA do Supabase pinado); auth Supabase, config Next, logs e utilitários BR vêm dos pacotes, o app guarda só o específico (ver `apps/web/CLAUDE.md`).
