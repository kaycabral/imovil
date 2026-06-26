# apps/tekoa — Frontend (@tekoa/web)

## Escopo

Modifique APENAS arquivos dentro de `apps/tekoa/` e `packages/tekoa/shared/` quando adicionar tipos compartilhados.

## Aliases (cross-workspace)

- `@tekoa/<pkg>` (resolvido via pnpm workspaces). Ex.: `import type { Profile } from '@tekoa/shared'`.
- `@e2e/*` resolve para `./e2e/*` (definido em `tsconfig.json`).
- `@cbrl/design` para primitivas UI + `cn` helper.

## Design system

Design system canônico é `@cbrl/design` (em `packages/design/`) — toda primitiva UI vem de lá (`Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Avatar`, `Badge`, `Skeleton`, `Switch`, `Textarea`, `Toaster`, `Select`, `Sheet`). Helper `cn` também vem do `@cbrl/design`.

- **Não copie** componentes do design pra `src/components/ui/` — sempre importe: `import { Button } from '@cbrl/design'`.
- Se precisar de variante específica que o design não tem, primeiro avalie se faz sentido adicionar ao `@cbrl/design`.
- **Componentes inline em tekoa**: hoje só `form.tsx` fica em `src/components/ui/` — é wrapper de `react-hook-form` (binding, não primitivo visual), então não tem equivalente no design. `select.tsx`/`sheet.tsx` foram migrados pro `@cbrl/design` (já existiam lá). Se um novo primitivo só do tekoa surgir e um 2º app precisar, promover (regra "2+ apps usam = sobe pro design").
- **Style alinhado**: shadcn `radix-nova` ([preset b0](https://ui.shadcn.com/create?preset=b0)). Componentes do design importam do umbrella `radix-ui` (style nova). O `form.tsx` inline ainda usa `@radix-ui/react-*` granular onde necessário.

## Auth (Firebase + session cookie)

- `@/lib/firebase/client.ts` — browser (client components). Exporta `getClientAuth()` e `getClientDb()`. Único arquivo Firebase importável de client component.
- `@/lib/firebase/admin.ts` — server-only (re-exporta de `@tekoa/db`). Use em route handlers / server actions.
- `@/lib/firebase/server.ts` — `getServerUser()` para RSC (lê cookie `__session`, valida via Admin SDK).
- `@/lib/firebase/session-cookie.ts` — constantes do cookie de sessão.

Fluxo de login (Google popup): `LoginForm` → `signInWithPopup` → `POST /api/auth/session` com ID token → server cria session cookie HTTP-only e faz upsert do doc `users/{uid}` no Firestore → redirect para `/painel`.

**Proibições (além das canônicas):**

- `@tekoa/db`, `@/lib/firebase/admin`, `@/lib/firebase/server` em **client components** — usam credenciais de service account.
- Importar `firebase-admin` direto em vez de via `@tekoa/db` — quebra DRY.

## Testes
