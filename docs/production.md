# Produção

Runbook do ambiente de produção do imovil: o que roda onde, como mudança chega lá e o que fazer quando dá errado.

## Topologia

| Peça                    | Onde                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| App (Next.js)           | Vercel, Root Directory na raiz do repo, domínio `imovil.vercel.app` |
| Postgres, Auth, Storage | Supabase, região `sa-east-1` (São Paulo)                            |
| Funções (SSR, actions)  | Vercel `gru1` (São Paulo), fixado em `vercel.json`                  |
| Login                   | Só Google (provider Google do Supabase Auth)                        |
| Migrations              | GitHub Actions, job `migrate-production` do `main.yml`              |

**Ninguém acessa o banco de produção da própria máquina.** Dev local roda inteiro no stack Supabase em Docker (`pnpm db:start`); a URL do banco de prod existe só no secret do GitHub e nas envs da Vercel.

## Fluxo de uma mudança

1. PR → `pull-request.yml`: roda `checks.yml` (format, lint, typecheck, higiene de migrations, unit, suíte Postgres + build contra o stack local, E2E) e o dependency review. O ruleset da `main` exige o check `CI passed` com a branch atualizada.
2. Merge na `main` → `main.yml`: o job `provenance` confirma pela API que a árvore do commit é idêntica à do head de um PR com `CI passed` verde. Confirmado, não re-roda nada; não confirmado (push direto via bypass, PR desatualizado), roda o pipeline completo antes. Então `migrate-production` (`pnpm db:migrate`) aplica as migrations pendentes em prod (no-op quando não há). Commit não provado → `migrate-production` **falha** em vez de ser pulado (um check "skipped" passaria no Deployment Check da Vercel).
3. Vercel builda o mesmo commit e só promove pra produção depois do check `migrate-production` passar (Deployment Checks). O código novo nunca entra no ar antes do schema que ele usa.

## Regras de migration

- **Gerar, nunca escrever à mão o diff de schema**: `pnpm db:generate`. SQL fora do Drizzle (trigger em `auth.users`, bucket, policies de storage) via `drizzle-kit generate --custom`.
- **Imutáveis depois do merge.** Errou? Nova migration corrigindo (fix forward). O CI bloqueia edição/rename/remoção.
- **Expand → contract.** Durante o deploy, a versão anterior do app roda contra o schema novo. Toda migration precisa ser compatível com o código que está no ar:
  - adicionar coluna: nullable ou com default;
  - renomear/remover coluna ou tabela: (1) PR que adiciona o novo e para de usar o antigo, (2) PR seguinte remove o antigo;
  - `NOT NULL` em coluna existente: backfill numa migration, constraint em outra.
- **Nunca `drizzle-kit push`** em prod.

## Rollback

- **App**: Vercel → Deployments → deploy anterior → _Instant Rollback_. Seguro por causa do expand → contract.
- **Schema**: não há down migration. Corrige com migration nova via PR. Em incidente com perda de dado: Supabase → Database → Backups (point-in-time depende do plano).
- **Migration falhou no CI**: o Drizzle aplica todas as pendentes numa única transação, então nada fica pela metade (consequência: nada de `CREATE INDEX CONCURRENTLY`, que não roda em transação). A Vercel não promove o deploy (check vermelho). Corrigir com PR e mergear.

## Configuração (uma vez)

### GitHub

- Ruleset `protect-main`: toda mudança via PR, com o check `CI passed` obrigatório e a branch atualizada (é o que permite ao `provenance` não re-rodar os checks na `main`).
- Environment `production`, restrito à branch `main`.
- Secret do environment `POSTGRES_URL_NON_POOLING`: connection string do **session pooler** (porta 5432) do Supabase — `postgresql://postgres.<ref>:<senha>@aws-<n>-sa-east-1.pooler.supabase.com:5432/postgres`. O host direto `db.<ref>.supabase.co` é só IPv6 e os runners do GitHub não alcançam; o pooler de transação (6543) não suporta o advisory lock do migrator.

### Vercel

- Envs de Production (a integração Supabase ↔ Vercel injeta as três primeiras): `POSTGRES_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MAPTILER_API_KEY`, flags `IMOVIL_FEATURE_*`.
- **Nunca** `ENABLE_TEST_AUTH` em Production/Preview.
- Settings → Deployment Checks: exigir o check `migrate-production` antes de promover pra produção.
- Deployment Protection (Vercel Authentication) só em Preview; o domínio de produção é público.

### Supabase Auth

- Site URL: `https://imovil.vercel.app`.
- Redirect URLs: `https://imovil.vercel.app/**` e o padrão dos previews da Vercel.
- Providers: Google ligado; Email desligado.
- Google Cloud (OAuth client _Web_ de produção): origin `https://imovil.vercel.app`; redirect URI `https://<ref>.supabase.co/auth/v1/callback`.
