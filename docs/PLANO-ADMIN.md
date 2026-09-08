# Plano: Painel Admin do ReEduca

> **Status:** Planejamento
> **Data:** 2026-09-04
> **Objetivo:** Criar um painel administrativo completo para moderação, gestão de usuários, denúncias, chat e métricas.

---

## 1. Visão Geral

O painel admin será uma seção isolada do app (`/admin/*`) com rotas protegidas que só acessam usuários com `role = 'admin'`. Inclui:

- **Dashboard** — Métricas gerais e KPIs
- **Denúncias** — Revisar, agir (ocultar anúncio, banir usuário, dispensar)
- **Chat** — Monitorar conversas entre usuários
- **Usuários** — Listar, ver detalhes, banir/desativar
- **Anúncios** — Moderar, ocultar, destaque
- **Configurações** — Settings gerais do platform

---

## 2. Modelo de Dados

### 2.1 Nova coluna: `users.role`

```sql
-- Adicionar enum de roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Adicionar coluna na tabela users
ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user' NOT NULL;

-- Promover o primeiro admin (substitua pelo seu Clerk userId)
UPDATE users SET role = 'admin' WHERE id = 'user_xxx';
```

### 2.2 Nova tabela: `reports.status`

```sql
-- Adicionar status nas denúncias
ALTER TABLE reports ADD COLUMN status varchar(20) DEFAULT 'pendente' NOT NULL;
ALTER TABLE reports ADD COLUMN reviewed_by text REFERENCES users(id);
ALTER TABLE reports ADD COLUMN reviewed_at timestamptz;
ALTER TABLE reports ADD COLUMN note varchar(500);

-- Valores: 'pendente', 'revisado', 'dispensado', 'aceito'
```

### 2.3 Nova tabela: `chat_messages` (monitoramento)

Não precisa de tabela nova — o admin pode ler a tabela `messages` existente com service_role.

### 2.4 Nova tabela: `admin_actions` (log de ações)

```sql
CREATE TABLE admin_actions (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_id    text NOT NULL REFERENCES users(id),
  action      varchar(50) NOT NULL,  -- 'ban_user', 'hide_listing', 'dismiss_report', etc.
  target_type varchar(20) NOT NULL,  -- 'user', 'listing', 'report', 'message'
  target_id   text NOT NULL,
  note        varchar(500),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);
```

### 2.5 Campo `users.banned_at`

```sql
ALTER TABLE users ADD COLUMN banned_at timestamptz;
ALTER TABLE users ADD COLUMN ban_reason varchar(500);
```

### 2.6 Campo `listings.featured`

```sql
ALTER TABLE listings ADD COLUMN featured boolean DEFAULT false NOT NULL;
```

---

## 3. Arquitetura de Rotas

```
/admin                          → Dashboard (métricas)
/admin/denuncias                → Lista de denúncias
/admin/denuncias/[id]           → Detalhe da denúncia + ações
/admin/usuarios                 → Lista de usuários
/admin/usuarios/[id]            → Detalhe do usuário + ações
/admin/anuncios                 → Lista de anúncios
/admin/anuncios/[id]            → Detalhe do anúncio + ações
/admin/chat                     → Lista de conversas
/admin/chat/[listingId]/[userId] → Visualizar conversa
/admin/config                   → Configurações
```

---

## 4. Middleware & Auth

### 4.1 Proteção de rotas admin

```ts
// src/middleware.ts — adicionar rotas admin
const isProtectedRoute = createRouteMatcher([
  '/novo(.*)',
  '/perfil(.*)',
  '/favoritos(.*)',
  '/chat(.*)',
  '/anuncio/(.*)/editar',
  '/admin(.*)',  // ← NOVO
]);
```

### 4.2 Helper: verificar se é admin

```ts
// src/lib/server-user.ts — adicionar:
export async function isAdmin(): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}
```

### 4.3 Rota API: verificar role

```ts
// src/app/api/admin/check/route.ts
// GET → retorna { admin: true/false }
// Usado pelo layout admin para redirecionar não-admins
```

---

## 5. Features Detalhadas

### 5.1 Dashboard (`/admin`)

**Métricas:**
- Total de usuários (hoje / 7d / 30d)
- Total de anúncios ativos
- Total de denúncias pendentes
- Total de mensagens (hoje / 7d)
- Anúncios criados por dia (gráfico)
- Usuários registrados por dia (gráfico)
- Top categorias
- Top regiões

**API:** `GET /api/admin/stats`

```ts
// Retorna:
{
  users: { total, today, week, month },
  listings: { total, active, reserved, completed },
  reports: { total, pending, reviewed },
  messages: { total, today, week },
  chartData: { dates, users[], listings[], messages[] },
  topCategories: [{ category, count }],
  topRegions: [{ region, count }]
}
```

**UI:**
- Cards de métricas no topo
- Gráficos de linha (usuários, anúncios, mensagens ao longo do tempo)
- Tabela de top categorias e regiões
- Alertas de denúncias pendentes

### 5.2 Sistema de Denúncias (`/admin/denuncias`)

**Lista:**
- Tabela com: data, tipo (anúncio/usuário), motivo, denunciante, status
- Filtros: status (pendente/revisado/dispensado/aceito), tipo
- Ordenação: mais recentes primeiro
- Badge de contagem pendente

**Detalhe (`/admin/denuncias/[id]`):**
- Informações da denúncia (motivo, tipo, data, denunciante)
- Link para o anúncio/usuário denunciado
- Ações:
  - **Dispensar** — marca como 'dispensado', sem ação
  - **Ocultar anúncio** — seta `deleted_at` no listing
  - **Banir usuário** — seta `banned_at` no user
  - **Anotação** — adiciona nota administrativa

**APIs:**
- `GET /api/admin/reports` — listar denúncias (com filtros)
- `GET /api/admin/reports/[id]` — detalhe
- `PATCH /api/admin/reports/[id]` — atualizar status + ação

**UI:**
- Lista com badges de status (amarelo = pendente, verde = revisado, vermelho = aceito)
- Modal de confirmação para ações destrutivas (banir, ocultar)
- Campo de nota administrativa
- Link direto para o listing/usuário denunciado

### 5.3 Gestão de Usuários (`/admin/usuarios`)

**Lista:**
- Tabela com: avatar, nome, email, região, role, data de cadastro, status (ativo/banido)
- Busca por nome/email
- Filtros: role, status
- Paginação

**Detalhe (`/admin/usuarios/[id]`):**
- Perfil completo (nome, email, região, bio, data de cadastro)
- Estatísticas: anúncios criados, avaliação média, denúncias recebidas
- Últimas denúncias contra este usuário
- Ações:
  - **Banir** — seta `banned_at` + motivo
  - **Desbanir** — limpa `banned_at`
  - **Promover a admin** — seta `role = 'admin'`
  - **Rebaixar** — seta `role = 'user'`

**APIs:**
- `GET /api/admin/users` — listar usuários
- `GET /api/admin/users/[id]` — detalhe
- `PATCH /api/admin/users/[id]` — banir/desbanir/promover

### 5.4 Gestão de Anúncios (`/admin/anuncios`)

**Lista:**
- Tabela com: foto, título, categoria, preço, vendedor, status, data
- Busca por título
- Filtros: categoria, status, deal
- Paginação

**Detalhe (`/admin/anuncios/[id]`):**
- Detalhes completos do anúncio (fotos, descrição, preço)
- Info do vendedor
- Denúncias recebidas
- Ações:
  - **Ocultar** — seta `deleted_at`
  - **Restaurar** — limpa `deleted_at`
  - **Destacar** — seta `featured = true`
  - **Remover destaque** — seta `featured = false`

**APIs:**
- `GET /api/admin/listings` — listar anúncios
- `GET /api/admin/listings/[id]` — detalhe
- `PATCH /api/admin/listings/[id]` — moderar

### 5.5 Monitoramento de Chat (`/admin/chat`)

**Lista de conversas:**
- Lista de threads (agrupadas por listing + usuários)
- Mostra: listing título, usuário 1, usuário 2, última mensagem, data
- Busca por nome de usuário ou título do listing

**Visualizar conversa (`/admin/chat/[listingId]/[userId]`):**
- Mesmo layout do chat normal
- Readonly (admin não envia mensagens)
- Indicador de qual usuário é qual
- Ações:
  - **Banir usuário** — a partir do chat

**APIs:**
- `GET /api/admin/chat/threads` — listar conversas
- `GET /api/admin/chat/[listingId]/[userId]` — ver mensagens

### 5.6 Configurações (`/admin/config`)

- Toggle de manutenção (futuro)
- Links rápidos para dashboard do Supabase
- Info da versão do app

---

## 6. Layout Admin

### 6.1 Sidebar

```
┌─────────────────────┐
│  ReEduca Admin      │
├─────────────────────┤
│  📊 Dashboard       │
│  🚨 Denúncias (3)   │  ← badge com pendentes
│  👥 Usuários        │
│  📦 Anúncios        │
│  💬 Chat            │
│  ⚙️  Config          │
├─────────────────────┤
│  ← Voltar ao site   │
│  Sair               │
└─────────────────────┘
```

### 6.2 Proteção

- Layout admin verifica role via `GET /api/admin/check`
- Se não for admin → redireciona para `/`
- Todas as API routes admin verificam `isAdmin()`

---

## 7. Segurança

1. **Todas as rotas `/api/admin/*`** verificam `isAdmin()` antes de processar
2. **Service role** usado apenas server-side (já é o padrão)
3. **Log de ações** — toda ação admin é registrada em `admin_actions`
4. **Rate limiting** — aplicar nas rotas admin (100 req/min)
5. **Não expor** `SUPABASE_SERVICE_ROLE_KEY` no client (já é o padrão)

---

## 8. Resumo de Arquivos

### Novos arquivos

| Arquivo | Propósito |
|---------|-----------|
| `src/app/admin/layout.tsx` | Layout admin com sidebar |
| `src/app/admin/page.tsx` | Dashboard |
| `src/app/admin/denuncias/page.tsx` | Lista de denúncias |
| `src/app/admin/denuncias/[id]/page.tsx` | Detalhe da denúncia |
| `src/app/admin/usuarios/page.tsx` | Lista de usuários |
| `src/app/admin/usuarios/[id]/page.tsx` | Detalhe do usuário |
| `src/app/admin/anuncios/page.tsx` | Lista de anúncios |
| `src/app/admin/anuncios/[id]/page.tsx` | Detalhe do anúncio |
| `src/app/admin/chat/page.tsx` | Lista de conversas |
| `src/app/admin/chat/[listingId]/[userId]/page.tsx` | Visualizar conversa |
| `src/app/admin/config/page.tsx` | Configurações |
| `src/app/api/admin/check/route.ts` | Verificar role admin |
| `src/app/api/admin/stats/route.ts` | Métricas do dashboard |
| `src/app/api/admin/reports/route.ts` | Listar denúncias |
| `src/app/api/admin/reports/[id]/route.ts` | Detalhe/atualizar denúncia |
| `src/app/api/admin/users/route.ts` | Listar usuários |
| `src/app/api/admin/users/[id]/route.ts` | Detalhe/atualizar usuário |
| `src/app/api/admin/listings/route.ts` | Listar anúncios |
| `src/app/api/admin/listings/[id]/route.ts` | Detalhe/moderar anúncio |
| `src/app/api/admin/chat/threads/route.ts` | Listar conversas |
| `src/app/api/admin/chat/[listingId]/[userId]/route.ts` | Ver mensagens |
| `src/components/admin/Sidebar.tsx` | Sidebar de navegação |
| `src/components/admin/StatsCard.tsx` | Card de métrica |
| `src/components/admin/DataTable.tsx` | Tabela genérica |
| `src/components/admin/ConfirmDialog.tsx` | Modal de confirmação |

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/middleware.ts` | Adicionar `/admin(.*)` nas rotas protegidas |
| `src/lib/server-user.ts` | Adicionar `isAdmin()` |
| `src/lib/supabase-types.ts` | Atualizar com novas colunas/tables |
| `docs/schema.sql` | Adicionar novas tabelas e colunas |

---

## 9. Tasks de Implementação

| # | Task | Depends | Prioridade |
|---|------|---------|------------|
| Task-006 | Schema: adicionar roles, status denúncias, admin_actions, banned_at, featured | [] | high |
| Task-007 | Auth: helper isAdmin() + middleware admin + API check | [Task-006] | high |
| Task-008 | Layout admin: sidebar + proteção de rotas | [Task-007] | high |
| Task-009 | Dashboard: API stats + página com métricas | [Task-008] | high |
| Task-010 | Denúncias: API CRUD + lista + detalhe + ações | [Task-008] | high |
| Task-011 | Usuários: API CRUD + lista + detalhe + banir/promover | [Task-008] | high |
| Task-012 | Anúncios: API CRUD + lista + detalhe + moderar | [Task-008] | high |
| Task-013 | Chat admin: API threads + visualização readonly | [Task-008] | medium |
| Task-014 | Config + polish final | [Task-009, Task-010, Task-011, Task-012] | low |

---

## 10. Stack

- **UI:** Tailwind CSS (já existente)
- **Charts:** Recharts ( leve, React-native )
- **Tables:** Componente próprio (DataTable genérico)
- **Auth:** Clerk + helper `isAdmin()` no Supabase
- **DB:** Supabase Postgres (service_role para queries admin)
- **State:** Server Components por padrão; `"use client"` apenas para interatividade
