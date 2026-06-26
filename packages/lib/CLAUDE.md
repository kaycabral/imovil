# packages/lib — Utilitários operacionais (@tekoa/lib)

## Escopo

Infra compartilhada (logger, env parser, http helpers, retries). **Sem lógica de negócio** — domínio fica em `packages/shared` ou no app.

## Regras

- **Sem dependência de `@tekoa/shared` ou `@tekoa/db`** — evita ciclos de import entre packages
- Utilitários genéricos, não acoplados a nenhum app específico
- Adicione aqui apenas quando a funcionalidade for **operacional** (logging, env, http) e reusada por 2+ apps
- Código novo sempre com testes unitários (`*.test.ts` co-localizado)
