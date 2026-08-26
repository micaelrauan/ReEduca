# Plano de Migração — Reeduca

> ## Status da Execução (2026-08-26)
>
> | Fase | Status | Observações |
> |------|--------|-------------|
> | 0 — Scaffold Next.js TS | ✅ | Backup legado em `%TEMP%\opencode\reeduca-legacy` + `app.tar.gz` |
> | 1 — Prisma + MySQL | ✅ | MySQL80 local; migrate `init` + seed aplicados |
> | 2 — Clerk | ✅ | Chaves reais de teste configuradas |
> | 3 — API Route Handlers | ✅ | zod + ownership; `ensureMirroredUser` cria espelho no 1º request |
> | 4 — Páginas | ✅ | 21 rotas dinâmicas; chat com polling 4s |
> | 5 — Limpeza | ✅ | `apps/pocketbase`, Vite, plugins removidos |
> | 6 — Verificação | ✅ | typecheck ✓ lint ✓ build ✓ |
> | **7 — Prisma → Supabase** | ✅ | **2026-08-26**: Prisma/MySQL removidos, Supabase Postgres via `@supabase/supabase-js`. Ver `docs/PLANO-SUPABASE.md` |
>
> ### Desvios em relação ao plano original
> - **shadcn/ui não foi portado**: auditoria mostrou que nenhuma página importava `components/ui/*`; o app sempre usou classes Tailwind diretas. Radix/react-hook-form/sonner saíram das dependências.
> - **Fotos**: uploads viraram lista de URLs (`photoUrls Json`); storage externo continua como fase futura.
> - **React fixado também no package.json raiz** — correção para o erro #31 de prerender (`/_error:/404`) causado por duas cópias do React no monorepo npm (lockfile antigo).
> - `dynamic = 'force-dynamic'` no root layout (shell depende de estado de auth em todas as rotas).
> - **Prisma → Supabase (2026-08-26)**: Prisma/MySQL removidos e substituídos por `@supabase/supabase-js` + Supabase Postgres. Ver `docs/PLANO-SUPABASE.md`.

Migração do monorepo atual (Vite + React SPA + PocketBase) para **Next.js (App Router) + Supabase (Postgres) + Clerk**. Posteriormente, Prisma/MySQL foi substituído por `@supabase/supabase-js`.

## 1. Estado Atual

| Item | Hoje |
|------|------|
| Frontend | `apps/web` — Vite + React 18 SPA (`react-router-dom`) |
| Backend/Dados | `apps/pocketbase` — PocketBase (SDK direto no client) |
| Auth | PocketBase email/senha via `AuthContext.jsx` |
| UI | shadcn/ui (`new-york`), Tailwind 3, lucide-react, framer-motion |
| Formulários | react-hook-form + zod |

Coleções PocketBase: `users` (+`region`, `bio`), `listings`, `favorites`, `messages`, `ratings`, `reports`.

## 2. Estado Alvo

| Item | Depois |
|------|--------|
| Framework | Next.js 15 (App Router, TypeScript) em `apps/web` |
| Banco | MySQL + Prisma ORM |
| Auth | Clerk (`@clerk/nextjs`) com sync de usuários via webhook |
| UI | Mantida: Tailwind, shadcn/ui (convertidos p/ `.tsx`), lucide, framer-motion |

## 3. Estrutura Final

```
Reeduca/
├── package.json                  # workspaces apps/*, scripts raiz
├── AGENTS.md
├── docs/PLANO-MIGRACAO.md
└── apps/web/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts               # dados dos seeds atuais
    ├── src/
    │   ├── middleware.ts         # clerkMiddleware()
    │   ├── app/
    │   │   ├── layout.tsx        # <ClerkProvider> + ThemeProvider
    │   │   ├── page.tsx          # Home
    │   │   ├── globals.css
    │   │   ├── anuncios/page.tsx
    │   │   ├── anuncio/[id]/page.tsx
    │   │   ├── anuncio/[id]/editar/page.tsx
    │   │   ├── novo/page.tsx
    │   │   ├── como-funciona/page.tsx
    │   │   ├── perfil/page.tsx
    │   │   ├── favoritos/page.tsx
    │   │   ├── chat/page.tsx
    │   │   ├── chat/[listingId]/[userId]/page.tsx
    │   │   ├── sign-in/[[...sign-in]]/page.tsx
    │   │   ├── sign-up/[[...sign-up]]/page.tsx
    │   │   └── api/
    │   │       ├── listings/route.ts            # GET lista/filtros, POST cria
    │   │       ├── listings/[id]/route.ts       # GET, PATCH, DELETE
    │   │       ├── favorites/route.ts           # GET/POST/DELETE
    │   │       ├── messages/route.ts            # GET thread, POST envio
    │   │       ├── ratings/route.ts             # POST avaliação
    │   │       ├── reports/route.ts             # POST denúncia
    │   │       └── webhooks/clerk/route.ts      # sync users (svix)
    │   ├── components/           # ui/* (shadcn .tsx) + negócio (Layout, ListingCard...)
    │   ├── hooks/
    │   ├── lib/
    │   │   ├── db.ts             # singleton PrismaClient
    │   │   ├── reeduca.ts        # CATEGORIES, DEALS, CONDITIONS, STATUSES, formatadores
    │   │   ├── utils.ts
    │   │   └── validators.ts     # schemas zod das rotas
    │   └── types/
    └── tsconfig.json             # paths "@/*": ["./src/*"]
```

Rotas permanecem em português. `index.html`, `vite.config.js`, `react-router-dom` e `pocketbase SDK` são removidos.

## 4. Modelo de Dados (PocketBase → Prisma/MySQL)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql"; url = env("DATABASE_URL") }

model User {
  id        String     @id                      // userId do Clerk (user_xxx)
  email     String     @unique @db.VarChar(255)
  name      String?    @db.VarChar(120)
  imageUrl  String?
  region    String?    @db.VarChar(120)
  bio       String?    @db.VarChar(500)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  listings  Listing[]
  favorites Favorite[]
  messagesSent     Message[] @relation("Sender")
  messagesReceived Message[] @relation("Recipient")
  ratingsGiven     Rating[]  @relation("Author")
  ratingsReceived  Rating[]  @relation("Target")
  reports          Report[]
}

enum Category { livros apostilas cadernos papelaria mochilas calculadoras tecnicos equipamentos }
enum Deal { venda troca doacao }
enum Condition { novo seminovo usado marcas_de_uso }
enum ListingStatus { ativo reservado concluido }

model Listing {
  id          String        @id @default(cuid())
  title       String        @db.VarChar(120)
  description String?       @db.VarChar(2000)
  category    Category
  deal        Deal
  condition   Condition
  price       Decimal?      @db.Decimal(10, 2)
  wanted      String?       @db.VarChar(200)
  region      String?       @db.VarChar(120)
  status      ListingStatus @default(ativo)
  photoUrls   Json?         // substitui photos(file)+photo_urls(json); uploads → storage externo
  sellerName  String?       @db.VarChar(120)
  sellerRating Decimal?     @db.Decimal(2, 1)
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  favorites   Favorite[]
  messages    Message[]
  ratings     Rating[]
  reports     Report[]
  @@index([category])
  @@index([deal])
  @@index([status])
  @@index([createdAt])
}

model Favorite {
  ownerId   String
  listingId String
  createdAt DateTime @default(now())
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  @@id([ownerId, listingId])
}

model Message {
  id          String   @id @default(cuid())
  text        String   @db.VarChar(1000)
  senderId    String
  recipientId String
  listingId   String?
  sender      User     @relation("Sender", fields: [senderId], references: [id], onDelete: Cascade)
  recipient   User     @relation("Recipient", fields: [recipientId], references: [id], onDelete: Cascade)
  listing     Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  @@index([listingId])
  @@index([senderId, recipientId, listingId])
}

model Rating {
  id        String   @id @default(cuid())
  stars     Int      // 1..5 (validar em zod)
  comment   String?  @db.VarChar(500)
  authorId  String
  targetId  String
  listingId String?
  author    User     @relation("Author", fields: [authorId], references: [id], onDelete: Cascade)
  target    User     @relation("Target", fields: [targetId], references: [id], onDelete: Cascade)
  listing   Listing? @relation(fields: [listingId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
}

model Report {
  id         String   @id @default(cuid())
  reason     String   @db.VarChar(500)
  kind       String   @db.VarChar(20) // "anuncio" | "usuario"
  reporterId String?
  listingId  String?
  reporter   User?    @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  listing    Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}
```

Notas:
- `photos` (upload PocketBase) vira `photoUrls Json`; para uploads reais usar Cloudinary/S3/Vercel Blob (fora do escopo desta fase).
- `seller_name`/`seller_rating` mantidos para compatibilidade com os seeds; no longo prazo derivar de `Rating`.
- Regras do PocketBase viram autorização nas Route Handlers (`auth()` do Clerk + checagem de ownership).

## 5. Mapeamento de Autenticação

| PocketBase (hoje) | Clerk (depois) |
|-------------------|----------------|
| `pb.authStore` / `AuthContext` | `useUser()` / `useAuth()` (client), `auth()` / `currentUser()` (server) |
| `LoginPage` / `SignupPage` | Páginas hospedeiras `<SignIn/>` / `<SignUp/>` (`sign-in`, `sign-up`) |
| `ProtectedRoute` | `clerkMiddleware()` + `auth().protect()` e/ou redirect server-side |
| `users` do PB | Tabela `User` espelho, sincronizada por webhook `user.created/updated/deleted` |
| `.env`: VITE_PB_URL etc. | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `DATABASE_URL` |

## 6. Mapeamento de Rotas

| react-router (hoje) | Next.js App Router | Proteção |
|---------------------|--------------------|----------|
| `/` | `app/page.tsx` | pública |
| `/anuncios` | `app/anuncios/page.tsx` | pública |
| `/anuncio/:id` | `app/anuncio/[id]/page.tsx` | pública |
| `/como-funciona` | `app/como-funciona/page.tsx` | pública |
| `/login` | `app/sign-in/[[...sign-in]]` | Clerk |
| `/cadastro` | `app/sign-up/[[...sign-up]]` | Clerk |
| `/novo` | `app/novo/page.tsx` | protegida |
| `/anuncio/:id/editar` | `app/anuncio/[id]/editar/page.tsx` | protegida + dono |
| `/perfil` | `app/perfil/page.tsx` | protegida |
| `/favoritos` | `app/favoritos/page.tsx` | protegida |
| `/chat` | `app/chat/page.tsx` | protegida |
| `/chat/:listingId/:userId` | `app/chat/[listingId]/[userId]/page.tsx` | protegida |

Conversões recorrentes: `<Link>`→`next/link`, `useParams/useNavigate`→`next/navigation`, `react-helmet`/`Seo.jsx`→Metadata API, `ScrollToTop`→remover (comportamento nativo).

Server Components onde não há interatividade (listagens, detalhe); `"use client"` nos formulários, chat (polling), favoritos.

## 7. Dependências

| Ação | Pacotes |
|------|---------|
| Adicionar | `next`, `@prisma/client`, `prisma` (dev), `@clerk/nextjs`, `svix`, `typescript`, tipos React/Node |
| Remover | `vite`, `@vitejs/plugin-react`, `esbuild`, `terser`, babel tools, `react-router-dom`, `react-helmet`, `pocketbase` |
| Manter | tailwind, radix/shadcn, framer-motion, react-hook-form, zod, date-fns, lucide-react, sonner, recharts |

## 8. Fases de Execução

### Fase 0 — Preparação
- [ ] Snapshot do estado atual (`app.tar.gz` já existe; criar backup adicional de `apps/web/src`)
- [ ] Scaffold Next.js TS em `apps/web` (substitui conteúdo Vite): `create-next-app --ts --app --tailwind`
- [ ] Portar `globals.css`, `tailwind.config.js`, `components.json`, `components/ui/*.jsx` → `.tsx`
- [ ] `tsconfig` com alias `@/*`

### Fase 1 — Banco (Prisma + MySQL)
- [ ] `schema.prisma` conforme seção 4; `prisma migrate dev`
- [ ] `lib/db.ts` singleton; `seed.ts` com os 6 listings dos seeds
- [ ] Variáveis: `DATABASE_URL="mysql://user:pass@localhost:3306/reduca"`

### Fase 2 — Auth (Clerk)
- [ ] Instalar/configurar `@clerk/nextjs`; páginas sign-in/sign-up
- [ ] `middleware.ts`; proteção das rotas da seção 6
- [ ] Webhook `app/api/webhooks/clerk/route.ts` (svix) sincronizando `User`
- [ ] Remover `AuthContext.jsx`, `LoginPage`, `SignupPage`, `ProtectedRoute`, `pocketbaseClient.js`

### Fase 3 — API (Route Handlers)
- [ ] Rotas da seção 3 com validação zod + autorização Clerk (ownership em PATCH/DELETE de listing)
- [ ] Portar `lib/reeduca.js` → `lib/reeduca.ts` (helpers `priceLabel`, `dealStyle`, `labelOf`)
- [ ] Uploads de fotos: placeholder URL externa nesta fase

### Fase 4 — Páginas (rota a rota, ordem sugerida)
1. Home → Anuncios (listagem + filtros) → Detalhe do anúncio
2. Como-funciona
3. Sign-in / Sign-up / Perfil
4. Novo/Editar anúncio (formulário existente + zod)
5. Favoritos
6. Chat lista + thread (polling ou SSE depois)

### Fase 5 — Limpeza
- [ ] Remover `apps/pocketbase`, `index.html`, configs Vite/babel/esbuild/terser
- [ ] Scripts raiz: `dev/build/start/lint` apontando só para `apps/web` (Next)
- [ ] Atualizar `knip.json`; adicionar `.env.example`
- [ ] `README`/docs atualizados

### Fase 6 — Verificação
- [ ] `npm run build` e `npm run lint` passam
- [ ] Smoke test: navegar, filtrar, favoritar, criar/editar anúncio, conversar, avaliar, denunciar
- [ ] Webhook Clerk testado localmente (ex.: `ngrok` ou `stripe listen`-like via `svix listen`)

## 9. Riscos e Decisões Pendentes

| Risco/Decisão | Mitigação |
|---------------|-----------|
| Migração de dados existentes do `pb_data` | Volume pequeno; script one-off lendo pb_data (JSON) e inserindo via Prisma, mapeando IDs PB → IDs Clerk |
| Uploads de fotos do PB | Re-hospedar em storage externo antes do corte definitivo |
| Chat em tempo real | Manter polling na migração; evoluir para SSE/WebSocket depois |
| Usuários existentes | Não há provedor de senhas migrável ao Clerk; considerar convite por magic link na primeira entrada |
