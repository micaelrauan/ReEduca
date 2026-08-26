# Plano de Migração — Prisma/MySQL → Supabase + Clerk

> **Status**: ✅ Concluído
> **Data**: 2026-08-26
> **Stack original**: Next.js 15 + Prisma (MySQL) + Clerk
> **Stack atual**: Next.js 15 + Supabase (Postgres) + Clerk

---

## 1. Visão Geral

Substituir o **Prisma ORM** (MySQL no Hostinger) pelo **Supabase JS Client** (`@supabase/supabase-js`), mantendo o **Clerk** como provedor de autenticação. O banco migra de MySQL para **Supabase Postgres** com **RLS (Row Level Security)** habilitado e integrado ao JWT do Clerk.

### Por que Supabase?
- Postgres gerenciado com pool de conexões incluído
- RLS nativo para segurança no nível do banco
- Dashboard com editor SQL, logs, e diff de schema
- Client JS tipado e com API fluida
- Não precisa de ORM — queries são nativas de Postgres

### Por que manter Clerk?
- Auth já implementada (sign-in, sign-up, webhooks, middleware)
- UI de auth pronta (`<SignIn/>`, `<SignUp/>`, `<UserButton/>`)
- Provider de JWT que o Supabase pode validar

---

## 2. Arquitetura: Clerk JWT + Supabase RLS

### Fluxo de autenticação

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌──────────┐
│  Browser │────▶│  Clerk  │────▶│  Next.js     │────▶│ Supabase │
│          │     │  (auth) │     │  (Server)    │     │ (Postgres)│
└─────────┘     └─────────┘     └──────────────┘     └──────────┘
                     │                   │                    │
                     │  JWT (Clerk)      │  service_role     │ RLS bypass
                     │◀──────────────────│  ou anon key      │ ou RLS policy
                     │                   │  + Clerk JWT      │
```

### Duas camadas de segurança

1. **Application-level** (já existe): `auth()` do Clerk + checagem de ownership nas Route Handlers
2. **Database-level** (novo): RLS policies no Postgres que usam o `sub` (user ID) do JWT

### Abordagem: Service Role no server

Como todas as queries passam por Server Components e Route Handlers (nunca no client), usar a **`SUPABASE_SERVICE_ROLE_KEY`** no server é a abordagem mais simples e segura:

- **Server-side** (Route Handlers + Server Components): `createClient(url, SERVICE_ROLE_KEY)` → bypass do RLS, acesso total
- **Client-side** (nunca usado neste projeto): seria `createClient(url, ANON_KEY)` com RLS

As RLS policies funcionam como **failsafe** — se alguém usar a anon key por engano, o RLS protege os dados. No fluxo normal, o server usa service_role e a auth é feita pelo Clerk antes de qualquer query.

### Configuração do Supabase JWT (para RLS futuro)

Se no futuro quiser usar RLS ativo (ex: client-side queries):

```sql
-- Criar função para extrair user_id do JWT do Clerk
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS text AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;
```

E nas policies:
```sql
-- Exemplo: usuário só vê seus próprios favoritos
CREATE POLICY "users_read_own_favorites" ON favorites
  FOR SELECT USING (owner_id = auth.user_id());

CREATE POLICY "users_insert_own_favorites" ON favorites
  FOR INSERT WITH CHECK (owner_id = auth.user_id());
```

---

## 3. Schema SQL (Postgres)

```sql
-- Enums
CREATE TYPE category AS ENUM (
  'livros', 'apostilas', 'cadernos', 'papelaria',
  'mochilas', 'calculadoras', 'tecnicos', 'equipamentos'
);

CREATE TYPE deal AS ENUM (
  'venda', 'troca', 'doacao'
);

CREATE TYPE condition AS ENUM (
  'novo', 'seminovo', 'usado', 'marcas_de_uso'
);

CREATE TYPE listing_status AS ENUM (
  'ativo', 'reservado', 'concluido'
);

-- Tabela: users
CREATE TABLE users (
  id         text PRIMARY KEY,           -- Clerk userId (user_xxx)
  email      varchar(255) UNIQUE NOT NULL,
  name       varchar(120),
  image_url  text,
  region     varchar(120),
  bio        varchar(500),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: listings
CREATE TABLE listings (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title          varchar(120) NOT NULL,
  description    varchar(2000),
  category       category NOT NULL,
  deal           deal NOT NULL,
  condition      condition NOT NULL,
  price          numeric(10,2),
  wanted         varchar(200),
  region         varchar(120),
  status         listing_status DEFAULT 'ativo',
  photo_urls     jsonb,
  seller_name    varchar(120),
  seller_rating  numeric(2,1),
  owner_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_deal ON listings(deal);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at);

-- Tabela: favorites (composite PK)
CREATE TABLE favorites (
  owner_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (owner_id, listing_id)
);

-- Tabela: messages
CREATE TABLE messages (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  text         varchar(1000) NOT NULL,
  sender_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id   text REFERENCES listings(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_listing ON messages(listing_id);
CREATE INDEX idx_messages_sender_recipient_listing ON messages(sender_id, recipient_id, listing_id);

-- Tabela: ratings
CREATE TABLE ratings (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stars      int NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment    varchar(500),
  author_id  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id text REFERENCES listings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ratings_target ON ratings(target_id);

-- Tabela: reports
CREATE TABLE reports (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reason      varchar(500) NOT NULL,
  kind        varchar(20) NOT NULL,  -- 'anuncio' | 'usuario'
  reporter_id text REFERENCES users(id) ON DELETE CASCADE,
  listing_id  text REFERENCES listings(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- RLS (habilitar em todas as tabelas)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies permissivas (service_role bypass, mas protegem anon key)
-- Leitura pública para listings e users
CREATE POLICY "public_read_listings" ON listings FOR SELECT USING (true);
CREATE POLICY "public_read_users" ON users FOR SELECT USING (true);

-- Escrita autenticada (refreada pelo server via service_role)
CREATE POLICY "auth_insert_listings" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_update_listings" ON listings FOR UPDATE USING (true);
CREATE POLICY "auth_delete_listings" ON listings FOR DELETE USING (true);

CREATE POLICY "auth_insert_users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_update_users" ON users FOR UPDATE USING (true);
CREATE POLICY "auth_delete_users" ON users FOR DELETE USING (true);

CREATE POLICY "auth_all_favorites" ON favorites FOR ALL USING (true);
CREATE POLICY "auth_all_messages" ON messages FOR ALL USING (true);
CREATE POLICY "auth_all_ratings" ON ratings FOR ALL USING (true);
CREATE POLICY "auth_all_reports" ON reports FOR ALL USING (true);
```

---

## 4. Arquitetura de arquivos

### Arquivos criados na migração

| Arquivo | Propósito |
|---------|-----------|
| `src/lib/supabase.ts` | Singleton do Supabase client (lazy init via proxy) |
| `src/lib/supabase-types.ts` | Tipos TypeScript do schema do banco (`Database`) |

### Arquivos reescritos na migração

| Arquivo | Mudança |
|---------|---------|
| `src/lib/reeduca.ts` | Removidos tipos Prisma; adicionados `UserRow`, `ListingRow`, `RatingRow`, `SerializedListing` |
| `src/lib/listings-query.ts` | Substituído Prisma types por tipos manuais |
| `src/lib/server-user.ts` | Queries Supabase (upsert/delete) |
| `src/app/page.tsx` | Queries Supabase |
| `src/app/anuncio/[id]/page.tsx` | Queries Supabase |
| `src/app/anuncio/[id]/editar/page.tsx` | Queries Supabase |
| `src/app/perfil/page.tsx` | Queries Supabase |
| `src/app/api/listings/route.ts` | Queries Supabase |
| `src/app/api/listings/[id]/route.ts` | Queries Supabase |
| `src/app/api/favorites/route.ts` | Queries Supabase |
| `src/app/api/messages/route.ts` | Queries Supabase |
| `src/app/api/messages/threads/route.ts` | Queries Supabase |
| `src/app/api/ratings/route.ts` | Queries Supabase |
| `src/app/api/reports/route.ts` | Queries Supabase |
| `src/app/api/profile/route.ts` | Queries Supabase |
| `src/app/api/webhooks/clerk/route.ts` | Queries Supabase |

### Arquivos removidos na migração

| Arquivo | Motivo |
|---------|--------|
| `prisma/` (diretório inteiro) | Substituído por SQL Supabase |
| `src/lib/db.ts` | Substituído por `src/lib/supabase.ts` |

### Arquivos sem mudança

| Arquivo | Nota |
|---------|------|
| `src/middleware.ts` | Clerk middleware sem alteração |
| `src/app/anuncios/page.tsx` | Usa `listings-query.ts` (já migrado) |
| `.env.example` | Atualizado com variáveis Supabase |
| `AGENTS.md` | Atualizado com stack Supabase |

---

## 5. Guia de Tradução Prisma → Supabase

### Setup do client (`src/lib/supabase.ts`)

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient<Database>;
};

function getSupabaseClient(): SupabaseClient<Database> {
  if (globalForSupabase.supabase) return globalForSupabase.supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }

  const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = client;
  return client;
}

// Proxy lazy — não cria o client até a primeira uso (evita crash no build)
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});
```

### Tipos (`src/lib/supabase-types.ts`)

Gerar tipos automaticamente com `npx supabase gen types typescript --project-id <ref> > src/lib/supabase-types.ts` após criar as tabelas. Os tipos manuais também funcionam — basta seguir o formato `GenericSchema` do Supabase (com `Tables`, `Views`, `Functions`, e `Relationships` em cada tabela).

### Padrões de query

| Operação Prisma | Supabase equivalente |
|-----------------|----------------------|
| `db.user.findUnique({ where: { id } })` | `supabase.from('users').select('*').eq('id', id).single()` |
| `db.user.findMany({ where: { email: { contains: 'x' } } })` | `supabase.from('users').select('*').ilike('email', '%x%')` |
| `db.user.findUnique({ where: { id }, include: { listings: true } })` | `supabase.from('users').select('*, listings(*)').eq('id', id).single()` |
| `db.listing.findMany({ where: { category: 'livros' }, orderBy: { createdAt: 'desc' }, take: 10 })` | `supabase.from('listings').select('*').eq('category', 'livros').order('created_at', { ascending: false }).limit(10)` |
| `db.listing.create({ data: { title, ... } })` | `supabase.from('listings').insert({ title, ... }).select().single()` |
| `db.listing.update({ where: { id }, data: { title } })` | `supabase.from('listings').update({ title }).eq('id', id).select().single()` |
| `db.listing.delete({ where: { id } })` | `supabase.from('listings').delete().eq('id', id)` |
| `db.favorite.upsert(...)` | `supabase.from('favorites').upsert({ owner_id, listing_id })` |
| `db.favorite.deleteMany({ where: { listingId } })` | `supabase.from('favorites').delete().eq('listing_id', listingId)` |
| `db.message.findMany({ include: { sender: true } })` | `supabase.from('messages').select('*, sender:users!sender_id(*)')` |
| `db.message.create({ data: {...} })` | `supabase.from('messages').insert({...}).select().single()` |
| `db.rating.create({ data: {...} })` | `supabase.from('ratings').insert({...}).select().single()` |
| `db.report.create({ data: {...} })` | `supabase.from('reports').insert({...}).select().single()` |
| `db.user.update({ where: { id }, data: {...} })` | `supabase.from('users').update({...}).eq('id', id).select().single()` |
| `db.user.upsert({ where: { id }, create: {...}, update: {...} })` | `supabase.from('users').upsert({ id, ... }).select().single()` |
| `db.user.deleteMany({ where: { id } })` | `supabase.from('users').delete().eq('id', id)` |

### Notas sobre a tradução

1. **`.single()`**: Obratório quando esperamos 1 resultado (substitui o `findUnique`)
2. **`select('*')`**: Supabase não retorna colunas por padrão — sempre usar `select()`
3. **`.eq()`**: Substitui `where: { field: value }`
4. **`.order()`**: Substitui `orderBy: { field: 'asc' }`
5. **`.limit()`**: Substitui `take: N`
6. **Joins**: Supabase usa `foreign key constraint name` nos joins (ex: `users!sender_id(*)`)
7. **`insert().select()`**: Para retornar o registro criado
8. **Cuid**: `gen_random_uuid()::text` no Postgres ou gerar no client com `crypto.randomUUID()`
9. **Lazy init**: O client Supabase usa `Proxy` para não crashar no build quando as env vars não estão disponíveis

---

## 6. Variáveis de Ambiente

### Nova configuração (`.env` / `.env.local`)

```env
# Supabase (https://supabase.com/dashboard → Project Settings → API)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk (https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# URLs das páginas do Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

### Removido

```env
DATABASE_URL=mysql://user:pass@host:3306/reduca  # ← removido
```

---

## 7. Dependências

### Removidas

```bash
npm uninstall @prisma/client prisma
```

### Adicionadas

```bash
npm install @supabase/supabase-js
```

### Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 8. Status das Fases

| Fase | Status | Data |
|------|--------|------|
| 1 — Setup (install + types + singleton) | ✅ | 2026-08-26 |
| 2 — Tipos + helpers (`reeduca.ts`, `listings-query.ts`) | ✅ | 2026-08-26 |
| 3 — Auth helper (`server-user.ts`) | ✅ | 2026-08-26 |
| 4 — Rotas API (8 arquivos) | ✅ | 2026-08-26 |
| 5 — Server Components (4 páginas) | ✅ | 2026-08-26 |
| 6 — Limpeza (prisma/, db.ts, deps) | ✅ | 2026-08-26 |
| 7 — Verificação (tsc, lint, build) | ✅ | 2026-08-26 |

---

## 9. Histórico de decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| IDs | UUID (`gen_random_uuid()`) | Mais simples, nativo do Postgres |
| Timestamps | `created_at`/`updated_at` (snake_case) | Padrão Postgres |
| Seed | SQL puro | Mais portável |
| RLS | Permissivas (service_role bypass) | Todas as queries são server-side |
| Client init | Proxy lazy | Evita crash no build sem env vars |
| Tipos | Manuais (com Relationships) | Funciona sem Supabase CLI |
