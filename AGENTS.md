# AGENTS.md

## Package Manager
Use **npm**: `npm install`, `npm run dev`, `npm run build`

## Stack
- Next.js 15 App Router + TypeScript (app na **raiz do repositório**, sem workspaces)
- MySQL via Prisma (`prisma/schema.prisma`) — acesso só em Server Components e Route Handlers (`src/lib/db.ts`)
- Clerk para auth (`@clerk/nextjs`); usuários espelhados em `User` via webhook `src/app/api/webhooks/clerk`; chaves reais obrigatórias em `.env`/`.env.local` (placeholders quebram o middleware em runtime)
- Tailwind CSS 3 com design system próprio (`src/app/globals.css`); **sem** shadcn/ui

## File-Scoped Commands
| Tarefa | Comando |
|--------|---------|
| Dev | `npm run dev` |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Lint arquivo | `npx eslint src/<caminho>.ts(x)` |
| Migration Prisma | `npx prisma migrate dev --name <nome>` |
| Seed | `npx prisma db seed` |

## Convenções
- Rotas e copy da UI em português; código/identificadores em inglês.
- Server Components por padrão; `"use client"` apenas quando houver interatividade.
- Validação de entrada com zod em toda Route Handler; autorização via `auth()` do Clerk + checagem de ownership.
- Nunca importar PrismaClient fora do servidor. Nunca expor `CLERK_SECRET_KEY`.
- Constantes de domínio (CATEGORIES, DEALS, CONDITIONS, STATUSES) vivem em `src/lib/reeduca.ts`.
- Padrões de migração: ver `docs/PLANO-MIGRACAO.md`.

## Estado Atual
Migração Vite/PocketBase → Next.js/Clerk/Prisma **concluída**, legado removido e projeto **achatado para app único na raiz** (compatível com Hostinger Node hosting). Documentação: `README.md`.

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: ox-alpha <noreply@opencode.ai>
```
