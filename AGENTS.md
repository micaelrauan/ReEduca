# AGENTS.md

## Package Manager
Use **npm** (workspaces `apps/*`): `npm install`, `npm run dev`, `npm run build`

## Stack
- Next.js 15 App Router + TypeScript (`apps/web`)
- MySQL via Prisma (`apps/web/prisma/schema.prisma`) — acesso só em Server Components e Route Handlers (`src/lib/db.ts`)
- Clerk para auth (`@clerk/nextjs`); usuários espelhados em `User` via webhook `app/api/webhooks/clerk`; chaves reais obrigatórias em `.env`/`.env.local` (placeholders quebram o middleware em runtime)
- Tailwind CSS 3 com design system próprio (`src/app/globals.css`); **sem** shadcn/ui
- `react`/`react-dom` declarados TAMBÉM no `package.json` raiz (evita duplicação de cópias no monorepo → erro #31 no build)

## File-Scoped Commands
| Tarefa | Comando |
|--------|---------|
| Dev | `npm run dev --prefix apps/web` |
| Typecheck | `npx tsc --noEmit -p apps/web` |
| Lint | `npm run lint --prefix apps/web` |
| Lint arquivo | `npx eslint apps/web/src/<caminho>.ts(x)` |
| Migration Prisma | `npx prisma migrate dev --schema apps/web/prisma/schema.prisma` |
| Seed | `npx prisma db seed` |

## Convenções
- Rotas e copy da UI em português; código/identificadores em inglês.
- Server Components por padrão; `"use client"` apenas quando houver interatividade.
- Validação de entrada com zod em toda Route Handler; autorização via `auth()` do Clerk + checagem de ownership.
- Nunca importar PrismaClient fora do servidor. Nunca expor `CLERK_SECRET_KEY`.
- Constantes de domínio (CATEGORIES, DEALS, CONDITIONS, STATUSES) vivem em `src/lib/reeduca.ts`.
- Padrões de migração: ver `docs/PLANO-MIGRACAO.md`.

## Estado Atual
Migração Vite/PocketBase → Next.js/Clerk/Prisma **concluída** e legado **removido do disco e do versionamento**. Pendente do usuário: colar chaves reais do Clerk em `apps/web/.env`. Documentação: `README.md`.

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: ox-alpha <noreply@opencode.ai>
```
