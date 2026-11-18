# packages/db — Postgres do imovil (@imovil/db)

## Escopo

Schema, migrations e queries do Postgres (Supabase) do imovil, com Drizzle + `pg`. **Só servidor**: no app, importe via `@/lib/db` (que tem `server-only`), nunca de client component — o pool usa a connection string do banco.

## Regras

- Schema em `src/schema.ts`; toda tabela com `.enableRLS()` e **sem policies** (só o servidor acessa, com o role `postgres` que bypassa RLS). Invariantes viram constraints nativas (`check`, `unique`, FK).
- Migrations versionadas em `drizzle/`: `pnpm --filter @imovil/db db:generate` gera; SQL custom (trigger em `auth.users`, bucket e policies de `storage`) via `drizzle-kit generate --custom`. Nunca `drizzle-kit push` em produção.
- Produção: migrations aplicadas **só pelo CI** (job `migrate-production`, depois de todos os checks, no merge pra `main`). Toda migration é compatível com o código que está no ar (expand → contract) e imutável depois do merge — o CI barra drift de schema e edição de migration antiga. Detalhes em [`docs/production.md`](../../docs/production.md).
- Conexão: `POSTGRES_URL` (nome da integração Supabase ↔ Vercel, pooler de transação). Pool via `@cbrl/pg` (`getOrCreateManagedPoolSync`, só modo password) com TLS do CA do Supabase pinado (`passwordModeSsl: supabaseSsl`); o `sslmode` da URL é removido para não sobrescrever o pin.
- Queries devolvem tipos de domínio de `@imovil/shared` (`Property`) — datas como ISO string, `coords` como par ou `null`.
- Testes: `pnpm test` (unit) e `POSTGRES_URL=<stack local> pnpm test:integration:pg` (contra o Postgres do stack local, que tem os schemas `auth`/`storage`). `truncateImovilTables` recusa host não-local.
