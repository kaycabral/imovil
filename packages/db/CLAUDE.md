# packages/db — Firebase Admin client (@tekoa/db)

## Escopo

Apenas backend (route handlers de admin, scripts, jobs). **Não importar em componentes client de `apps/web`** — o cliente usa credenciais de serviço e bypassa as Firestore Security Rules.

Para requests de usuário autenticado em `apps/web`, use `@/lib/firebase/admin.ts` (server) ou o Firebase Web SDK (`@/lib/firebase/client.ts`), que respeita as rules via token do usuário.

## Regras

- Exports: `getAdminAuth()`, `getAdminDb()`, `getAdminRemoteConfig()`. Singletons internos via `getApps()` guard — chamar várias vezes é seguro.
- Bypassa as `firestore.rules` por design: use para criação de doc no callback de sessão, jobs, webhooks, backfills. Nunca para servir dado de usuário comum sem checar `request.auth`.
- Sem tipos de domínio aqui — retorna `Auth` / `Firestore` / `RemoteConfig` genéricos do `firebase-admin`. Tipos compartilhados em `@tekoa/shared`.
- Project ID obrigatório: `FIREBASE_ADMIN_PROJECT_ID` (com fallback pra `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
- Auth mode escolhido em runtime:
  - Se `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY` estão setados → cert (SA JSON). A private key vem com `\n` escapados em `.env`; o módulo desfaz o escape antes de passar ao SDK. Útil para local sem emulator e ambientes que permitem mintar SA keys.
  - Caso contrário → ADC (Application Default Credentials). É o caminho default em produção (App Hosting / Cloud Run usa o SA do runtime sem precisar de JSON key) e em qualquer ambiente onde `iam.disableServiceAccountKeyCreation` bloqueia geração de keys.
- Emulator: quando `FIRESTORE_EMULATOR_HOST` ou `FIREBASE_AUTH_EMULATOR_HOST` está setado, init pula resolução de credencial.
