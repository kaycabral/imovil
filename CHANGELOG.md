# Changelog — @tekoa/web

Histórico de releases do tekoa, preservado da migração polyrepo→monorepo. Originalmente publicado em `cbrl-dev/tekoa/releases` antes do repo ser apagado em 2026-05-07.

Ordenado da mais recente pra mais antiga.

---

## v0.1.8 — 2026-05-02

## What's Changed

### ✨ Novidades

- refactor(auth): drop login dialog, sign in directly on click

### 🐛 Correções

- fix(e2e): replace login-dialog assertion with popup wait
- fix(web): wrap AppMenuClient in Suspense to unblock /novidades prerender

---

## v0.1.7 — 2026-05-02

## What's Changed

### ✨ Novidades

- refactor(web): extract field controls from property-form
- refactor(web): extract BrokerContactDialog from property-form
- refactor(web): extract usePropertyDraft hook
- refactor(web): extract useCepLookup hook + improve CEP error message
- refactor(web): extract usePropertyImages hook

### 🐛 Correções

- fix(web): include status and body in login session error message

## New Contributors

- @tekoa-deploy[bot] made their first contribution in https://github.com/cbrl-dev/tekoa/pull/71

---

## v0.1.6 — 2026-04-25

## Novidades

### ✨ Novidades

Agora você pode acessar um menu unificado em todas as rotas do site, tanto na versão mobile quanto na desktop. Isso traz mais fluidez e facilidade de navegação para encontrar o que você precisa.

### 🚀 Melhorias

Fizemos ajustes na aparência e na experiência de uso do menu, garantindo que ele funcione de maneira eficiente tanto em dispositivos móveis quanto em desktops.

Pequenas melhorias de bastidor nesta versão.

<details>
<summary>Detalhes técnicos</summary>

## What's Changed

### ✨ Novidades

- feat(web): unified AppMenu across all routes (mobile + desktop)
- test(web): cover AppMenu mobile sheet + desktop dropdown flows

## New Contributors

- @github-actions[bot] made their first contribution in https://github.com/kaycabral/tekoa/pull/63
- @tekoa-deploy[bot] made their first contribution in https://github.com/kaycabral/tekoa/pull/71

</details>

---

## v0.1.5 — 2026-04-25

## Novidades

Pequenas melhorias de bastidor nesta versão.

<details>
<summary>Detalhes técnicos</summary>

## New Contributors

- @github-actions[bot] made their first contribution in https://github.com/kaycabral/tekoa/pull/63

</details>

---

## v0.1.4 — 2026-04-25

## Novidades

Pequenas melhorias de bastidor nesta versão.

<details>
<summary>Detalhes técnicos</summary>

## What's Changed

### 🐛 Correções

- fix(deploy): guard against empty release (tag = main HEAD)

### 🏗️ Infra

- chore: bootstrap PR-based deploy flow (staging → main sync)

</details>

---

## v0.1.1 — 2026-04-24

## Novidades

Pequenas melhorias de bastidor nesta versão.

<details>
<summary>Detalhes técnicos</summary>

## What's Changed

### 🏗️ Infra

- chore: bootstrap deploy.yml prod target (staging → main sync)

</details>

---

## v0.1.0 — 2026-04-24

## Novidades

Pequenas melhorias de bastidor nesta versão.

<details>
<summary>Detalhes técnicos</summary>

## What's Changed

### 🏗️ Infra

- chore: bootstrap deploy.yml Firestore flow (staging → main sync)

</details>

---

## v0.0.0 — 2026-04-24

## Novidades

### ✨ Novidades

Agora você pode acessar a nova página pública de imóveis com design atualizado do Tekoa. Adicionamos também uma lista pública onde você pode aplicar filtros para facilitar a busca pelos imóveis disponíveis.

Incluímos um painel para corretores com uma interface nova. Você também pode alternar entre tema claro e escuro pela barra de navegação superior do site.

Adicionamos a funcionalidade de cadastrar, editar e gerenciar seus imóveis dentro do painel, junto com o seu perfil de corretor.

<details>
<summary>Detalhes técnicos</summary>

## What's Changed

### ✨ Novidades

- feat(web): public property page with Tekoa design tokens
- feat(web): public listing at /i with filters and 15 mocks
- feat(web): broker dashboard shell at /painel (UI only, no auth)
- feat(web): theme toggle (light/dark) in public nav and painel topbar
- feat: migrate Supabase → Firebase + unified site chrome
- feat: property CRUD, map, profile + 143 tests
- feat: Playwright E2E infra + broker contact flow
- feat(smoke): Playwright smoke tests against staging
- feat(release): gate prod on release + auto user-facing changelog

### 🐛 Correções

- fix: skip husky install in production and CI
- fix: guard husky install on Vercel env var
- fix(db): materialize WIF creds at runtime for Vercel functions
- fix(db): use @vercel/oidc + ExternalAccountClient for GCP WIF
- fix(db): sign on Vercel + Firestore via @google-cloud/firestore
- fix(db): Firestore via @google-cloud/firestore 8.x + cloud-platform scope
- fix(smoke): fill required fields and avoid seeded-data dependency
- fix(smoke): switch Vercel bypass from header to cookie

### 🏗️ Infra

- chore: reset project to cbrl-dev/stack-starter baseline
- fix(smoke): route through Vercel Protection Bypass (re-enable SSO)
- chore: bootstrap staging-gate flow (staging → main sync)

### 📚 Docs

- docs: strengthen CLAUDE.md rules for shadcn/Radix and DRY

</details>

---
