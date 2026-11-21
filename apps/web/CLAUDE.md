# apps/web — Frontend (@imovil/web)

## Escopo

Modifique APENAS arquivos dentro de `apps/web/` e `packages/shared/` quando adicionar tipos compartilhados.

## Aliases (cross-workspace)

- `@imovil/<pkg>` (resolvido via pnpm workspaces). Ex.: `import type { Profile } from '@imovil/shared'`.
- `@e2e/*` resolve para `./e2e/*` (definido em `tsconfig.json`).
- `@cbrl/design` (pacote npm publicado) para primitivas UI + `cn` helper.

## Design system

Design system canônico é `@cbrl/design` (pacote npm, fonte no repo `kaycabral/toolkit`) — toda primitiva UI vem de lá (`Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Avatar`, `Badge`, `Skeleton`, `Switch`, `Textarea`, `Toaster`, `Select`, `Sheet`). Helper `cn` também vem do `@cbrl/design`.

- **Não copie** componentes do design pra `src/components/ui/` — sempre importe: `import { Button } from '@cbrl/design'`.
- Se precisar de variante específica que o design não tem, primeiro avalie se faz sentido adicionar ao `@cbrl/design` (no toolkit).
- **Componentes inline em imovil**: hoje só `form.tsx` fica em `src/components/ui/` — é wrapper de `react-hook-form` (binding, não primitivo visual), então não tem equivalente no design. `select.tsx`/`sheet.tsx` vêm do `@cbrl/design`. Se um novo primitivo só do imovil surgir e um 2º app precisar, promover (regra "2+ apps usam = sobe pro design").
- **Style alinhado**: shadcn `radix-nova` ([preset b0](https://ui.shadcn.com/create?preset=b0)). Componentes do design importam do umbrella `radix-ui` (style nova). O `form.tsx` inline ainda usa `@radix-ui/react-*` granular onde necessário.

## Backend (Supabase)

Banco, login e arquivos são Supabase; não há Firebase no imovil.

- **Banco (Postgres)** só no servidor, via `@/lib/db` (`server-only`, re-exporta `@imovil/db`: Drizzle + `pg`). Tabelas com RLS ligada e **sem policies** — o browser nunca lê/escreve o banco; toda escrita passa por server action (`src/app/actions/*`).
- **Auth** com `@cbrl/supabase` (sobre `@supabase/ssr`, sessão em cookie; clients `null` quando `NEXT_PUBLIC_SUPABASE_*` falta — o app degrada em vez de quebrar):
  - `@cbrl/supabase/client` — browser (client components): Auth e Storage.
  - `@cbrl/supabase/server` — server (RSC, actions, route handlers), cookies do request.
  - `src/proxy.ts` — `updateSession` (`@cbrl/supabase/proxy`) refresca a sessão em toda rota (menos assets e `/api/csp-report`).
  - `@/lib/auth/server.ts` — `getServerUser()` → `SessionUser | null` (`sessionUserFromClaims`) via `getClaims()` (verifica o JWT), dentro de `readBackend`. **Nunca** confiar em `getSession()` no servidor.
- **Fluxo de login (Google, redirect)**: `useGoogleSignIn` (`@/hooks`, wrapper do `@cbrl/supabase/react` que escolhe o `next` e os toasts) → Google → `/auth/callback` (`authCallbackRoute`: troca o code pela sessão) → `next` (same-origin). O perfil (`profiles`) nasce do trigger `on_auth_user_created`. Login de teste do E2E: `/api/e2e-signin` (`testSignInRoute`).
- **Fotos**: bucket público `property-images` (Supabase Storage). Upload direto do browser no caminho `{userId}/…` — as policies do storage só permitem a pasta do próprio usuário.
- **Degradação**: leitura de backend no servidor passa por `readBackend` (`@/lib/backend-read`, timeout + fallback). Backend fora → páginas renderizam o estado "Tentar de novo"; sessão indisponível = deslogado.

## Pacotes do toolkit (não recriar no app)

- **Logs**: `logger` do `@cbrl/log` (JSON estruturado, redação de PII). `no-console` é erro em `src/` (testes fora). O `@cbrl/log` é só Node: client component não loga, mostra o erro na UI.
- **Next**: `next.config.ts` usa `@cbrl/next/config` (headers de segurança, CSP em `report-only` com reports em `/api/csp-report` via `cspReportRoute`, `commitSha`, `devOrigins`); `/api/health` é `healthRoute`; `safeNext` vem do `@cbrl/next`.
- **BR**: telefone/WhatsApp (`@cbrl/br/phone`: `maskBrazilPhone`, `normalizeBrazilPhone`, `whatsappUrl`), dinheiro (`@cbrl/br/money`), CEP (`@cbrl/br/postal-code`: `lookupPostalCode`, `maskPostalCode`). A rota `/api/postal-code` mantém o rate limit do app.
- **UI**: `ThemeProvider`, `initials`, `WhatsappIcon` vêm do `@cbrl/design`.
- **Testes**: `installJsdomPolyfills` (`vitest.setup.ts`), `defineE2EConfig`/`defineSmokeConfig`/`smokeSuite` (configs do Playwright), `readLocalSupabase`/`writeEnvLocal` (`@cbrl/supabase/local`) nos scripts e no Playwright.

**Proibições (além das canônicas):**

- `@/lib/db`, `@/lib/auth/server`, `@cbrl/supabase/server`, `@cbrl/log` em **client components**.
- Acessar o banco pelo client do Supabase (PostgREST) — dado vai por server action / RSC.
- Chave secreta do Supabase no app: ela só existe no stack local (E2E/seed).

## Ambiente local

`pnpm db:start` (stack Supabase local via Docker + migrations) → `pnpm db:env` (grava `.env.local`) → `pnpm db:seed` → `pnpm dev`. O login Google não roda local (sem OAuth client); use o login de teste indicado pelo `db:seed`. Studio em http://127.0.0.1:54323.

## Testes
