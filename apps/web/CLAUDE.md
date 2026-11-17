# apps/imovil — Frontend (@imovil/web)

## Escopo

Modifique APENAS arquivos dentro de `apps/imovil/` e `packages/imovil/shared/` quando adicionar tipos compartilhados.

## Aliases (cross-workspace)

- `@imovil/<pkg>` (resolvido via pnpm workspaces). Ex.: `import type { Profile } from '@imovil/shared'`.
- `@e2e/*` resolve para `./e2e/*` (definido em `tsconfig.json`).
- `@cbrl/design` para primitivas UI + `cn` helper.

## Design system

Design system canônico é `@cbrl/design` (em `packages/design/`) — toda primitiva UI vem de lá (`Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Avatar`, `Badge`, `Skeleton`, `Switch`, `Textarea`, `Toaster`, `Select`, `Sheet`). Helper `cn` também vem do `@cbrl/design`.

- **Não copie** componentes do design pra `src/components/ui/` — sempre importe: `import { Button } from '@cbrl/design'`.
- Se precisar de variante específica que o design não tem, primeiro avalie se faz sentido adicionar ao `@cbrl/design`.
- **Componentes inline em imovil**: hoje só `form.tsx` fica em `src/components/ui/` — é wrapper de `react-hook-form` (binding, não primitivo visual), então não tem equivalente no design. `select.tsx`/`sheet.tsx` foram migrados pro `@cbrl/design` (já existiam lá). Se um novo primitivo só do imovil surgir e um 2º app precisar, promover (regra "2+ apps usam = sobe pro design").
- **Style alinhado**: shadcn `radix-nova` ([preset b0](https://ui.shadcn.com/create?preset=b0)). Componentes do design importam do umbrella `radix-ui` (style nova). O `form.tsx` inline ainda usa `@radix-ui/react-*` granular onde necessário.

## Backend (Supabase)

Banco, login e arquivos são Supabase; não há Firebase no imovil.

- **Banco (Postgres)** só no servidor, via `@/lib/db` (`server-only`, re-exporta `@imovil/db`: Drizzle + `pg`). Tabelas com RLS ligada e **sem policies** — o browser nunca lê/escreve o banco; toda escrita passa por server action (`src/app/actions/*`).
- **Auth** com `@supabase/ssr` (sessão em cookie):
  - `@/lib/supabase/config.ts` — URL + publishable key (`NEXT_PUBLIC_SUPABASE_*`); `null` quando não configurado (o app degrada em vez de quebrar).
  - `@/lib/supabase/client.ts` — browser (client components): Auth e Storage.
  - `@/lib/supabase/server.ts` — server (RSC, actions, route handlers), cookies do request.
  - `@/lib/supabase/proxy.ts` + `src/proxy.ts` — refresh da sessão em toda rota.
  - `@/lib/auth/server.ts` — `getServerUser()` → `SessionUser | null` via `getClaims()` (verifica o JWT). **Nunca** confiar em `getSession()` no servidor.
- **Fluxo de login (Google, redirect)**: `useGoogleSignIn` → `signInWithOAuth` → Google → `/auth/callback` (troca o code pela sessão) → `next` (same-origin, `safeNext`). O perfil (`profiles`) nasce do trigger `on_auth_user_created`.
- **Fotos**: bucket público `property-images` (Supabase Storage). Upload direto do browser no caminho `{userId}/…` — as policies do storage só permitem a pasta do próprio usuário.
- **Degradação**: leitura de backend no servidor passa por `readBackend` (`@/lib/backend-read`, timeout + fallback). Backend fora → páginas renderizam o estado "Tentar de novo"; sessão indisponível = deslogado.

**Proibições (além das canônicas):**

- `@/lib/db`, `@/lib/auth/server`, `@/lib/supabase/server` em **client components**.
- Acessar o banco pelo client do Supabase (PostgREST) — dado vai por server action / RSC.
- Chave secreta do Supabase no app: ela só existe no stack local (E2E/seed).

## Ambiente local

`pnpm db:start` (stack Supabase local via Docker + migrations) → `pnpm db:env` (grava `.env.local`) → `pnpm db:seed` → `pnpm dev`. O login Google não roda local (sem OAuth client); use o login de teste indicado pelo `db:seed`. Studio em http://127.0.0.1:54323.

## Testes
