# AGENTS.md

## Package Manager
Use **npm**: `npm install`, `npm run dev`, `npm run build`

## Stack
- Next.js 15 App Router + TypeScript (app na **raiz do repositório**, sem workspaces)
- Supabase Postgres via `@supabase/supabase-js` — acesso só em Server Components e Route Handlers (`src/lib/supabase.ts`); schema SQL em `docs/PLANO-SUPABASE.md`
- Clerk para auth (`@clerk/nextjs`); usuários espelhados em `User` via webhook `src/app/api/webhooks/clerk`; chaves reais obrigatórias em `.env`/`.env.local` (placeholders quebram o middleware em runtime)
- Tailwind CSS 3 com design system próprio (`src/app/globals.css`); **sem** shadcn/ui

## File-Scoped Commands
| Tarefa | Comando |
|--------|---------|
| Dev | `npm run dev` |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Lint arquivo | `npx eslint src/<caminho>.ts(x)` |
| Supabase types | `npx supabase gen types typescript --project-id <ref> > src/lib/supabase-types.ts` |

## Convenções
- Rotas e copy da UI em português; código/identificadores em inglês.
- Server Components por padrão; `"use client"` apenas quando houver interatividade.
- Validação de entrada com zod em toda Route Handler; autorização via `auth()` do Clerk + checagem de ownership.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` ou `CLERK_SECRET_KEY` no client-side.
- Constantes de domínio (CATEGORIES, DEALS, CONDITIONS, STATUSES) vivem em `src/lib/reeduca.ts`.
- Todas as queries ao banco usam `supabase` de `src/lib/supabase.ts` (service role, bypass RLS).
- Padrões de migração: ver `docs/PLANO-MIGRACAO.md`.

## Estado Atual
Migração Vite/PocketBase → Next.js/Clerk/Supabase **concluída**, legado removido e projeto **achatado para app único na raiz** (compatível com Hostinger Node hosting). Schema SQL: `docs/PLANO-SUPABASE.md`. Documentação: `README.md`.

## Task Execution Pipeline

### Arquivos
| Arquivo | Função |
|---------|--------|
| `execucao-tasks/TASKS.md` | Manifesto de tarefas — cada bloco `## Task-XXXX` define uma tarefa |
| `execucao-tasks/TASK-STATE.json` | Estado compartilhado — progresso, checkpoints e log de execução |
| `execucao-tasks/EXEMPLO-TASKS.md` | Exemplo real de tasks para o projeto |

### Protocolo de Execução (Obrigatório)

Quando o usuário diz "executar tasks" ou "rodar o pipeline":

1. **Ler `execucao-tasks/TASKS.md`** → parsear todas as tarefas e dependências
2. **Ler `execucao-tasks/TASK-STATE.json`** → retomar de onde parou (se houver checkpoint)
3. **Montar DAG de execução** → respeitar dependências (`Depends`)
4. **Para CADA tarefa, ANTES de executar:**
   - **Planejar** → ler o bloco da tarefa, entender o objetivo, critérios e plano
   - **Listar arquivos** que serão criados/modificados
   - **Justificar** a abordagem escolhida (por que essa e não outra)
5. **Executar** → seguir o plano da tarefa
6. **Validar** → rodar os comandos de Validação de cada tarefa
7. **Se passar** → marcar `completed` em TASK-STATE.json
8. **Se falhar** → executar Auto-Fix (max 2 retries)
9. **Se retry falhar** → marcar `failed`, logar erro, PARAR pipeline
10. **Commit** → após cada tarefa completa, fazer commit com mensagem descritiva
11. **Avançar** → só então partiu pra próxima tarefa

### Formato TASK-STATE.json (por tarefa)
```json
{
  "Task-001": {
    "status": "completed",
    "started_at": "2026-08-29T10:00:00Z",
    "completed_at": "2026-08-29T10:05:00Z",
    "retries": 0,
    "validation_output": "...",
    "error": null
  }
}
```

### Regras Críticas
- **NUNCA pular uma tarefa** cuja dependência falhou
- **NUNCA marcar completed** sem rodar Validação
- **NUNCA continuar** após falha sem retry
- **SEMPRE** atualizar TASK-STATE.json após cada ação
- **SEMPRE** ler TASK-STATE.json antes de começar (retomar de checkpoint)

### Criando Tarefas
Use o template em `execucao-tasks/TASKS.md` (bloco comentado no final). Cada tarefa precisa:
- `Depends` com IDs válidos ou `[]`
- Critérios de Aceite mensuráveis (testáveis)
- Comandos de Validação que provam correção
- Auto-Fix com max retries definido

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: ox-alpha <noreply@opencode.ai>
```
