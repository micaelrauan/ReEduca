# ReEduca

Plataforma onde estudantes **vendem, trocam ou doam** materiais escolares — livros, apostilas, cadernos, mochilas, calculadoras e equipamentos — direto com quem estuda perto deles.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Banco de dados | Supabase Postgres via `@supabase/supabase-js` |
| Autenticação | Clerk (`@clerk/nextjs`) com espelho de usuários no Supabase |
| Estilo | Tailwind CSS 3 (design system próprio em `globals.css`) |
| Validação | Zod em toda Route Handler |

## Requisitos

- Node.js **22** (ver `.nvmrc`)
- Conta no [Supabase](https://supabase.com) (plano free atende)
- Conta no [Clerk](https://clerk.com) (plano free atende)

## Configuração

```bash
npm install                # instala as dependências
cp .env.example .env       # depois edite com seus valores
```

Preencha o `.env`:

```env
# Supabase (https://supabase.com/dashboard → Project Settings → API)
SUPABASE_URL="https://SEU-PROJETO.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Clerk (https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Crie o schema do banco no Supabase:

1. Acesse o [SQL Editor](https://supabase.com/dashboard/project/_/sql/new) no painel do Supabase
2. Cole e execute o SQL completo em `docs/PLANO-SUPABASE.md` (seção 3 — Schema SQL)
3. (Opcional) Execute os inserts de seed para dados demo

> Para regenerar os tipos TypeScript do banco: `npx supabase gen types typescript --project-id <ref> > src/lib/supabase-types.ts`

## Executando

| Tarefa | Comando |
|--------|---------|
| Desenvolvimento | `npm run dev` → http://localhost:3000 |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Build de produção | `npm run build` |
| Servir build | `npm start` |
| Gerar tipos Supabase | `npx supabase gen types typescript --project-id <ref> > src/lib/supabase-types.ts` |

## Estrutura

```
src/
├── middleware.ts              # clerkMiddleware + rotas protegidas
├── app/
│   ├── layout.tsx             # ClerkProvider + AppShell global
│   ├── page.tsx               # Home (hero, categorias, recentes)
│   ├── anuncios/              # busca com filtros por URL (?q=&categoria=&tipo=...)
│   ├── anuncio/[id]/          # detalhe (+ /editar protegida por dono)
│   ├── novo/                  # criar anúncio (auth obrigatória)
│   ├── como-funciona/
│   ├── perfil/                # meus anúncios por status + avaliações
│   ├── favoritos/
│   ├── chat/                  # lista de conversas e thread (polling 4s)
│   ├── sign-in/ sign-up/      # páginas Clerk
│   └── api/                   # Route Handlers (ver tabela abaixo)
├── components/
│   ├── layout/AppShell.tsx    # header, footer e bottom-nav mobile
│   ├── listing/               # Grid, Gallery, Actions, Form
│   └── profile/
├── hooks/useFavorites.ts      # favoritos sincronizados via API
└── lib/
    ├── supabase.ts            # singleton do Supabase client (service role)
    ├── supabase-types.ts      # tipos gerados do schema do banco
    ├── reeduca.ts             # constantes de domínio + helpers + serialização
    ├── listings-query.ts      # lógica de busca/filtros
    ├── validators.ts          # schemas zod das rotas
    └── server-user.ts         # espelho do usuário Clerk na tabela users
```

## Modelo de dados

| Tabela | Função |
|--------|--------|
| `users` | Espelho dos usuários do Clerk (`id` = userId Clerk) + `region`, `bio` |
| `listings` | Anúncio: título, categoria, tipo (venda/troca/doação), condição, preço, região, status, `photo_urls` (JSON) |
| `favorites` | Favorito (par único usuário+anúncio) |
| `messages` | Mensagens do chat entre dois usuários sobre um anúncio |
| `ratings` | Avaliação 1–5 estrelas de um usuário para outro |
| `reports` | Denúncia de anúncio ou usuário |

Todas as tabelas usam `ON DELETE CASCADE` (ex.: apagar usuário apaga seus anúncios/favoritos/mensagens).

Schema SQL completo: `docs/PLANO-SUPABASE.md` (seção 3).

## Rotas da aplicação

| Rota | Acesso |
|------|--------|
| `/`, `/anuncios`, `/anuncio/[id]`, `/como-funciona` | pública |
| `/sign-in`, `/sign-up` | Clerk |
| `/novo`, `/perfil`, `/favoritos`, `/chat`, `/chat/[listingId]/[userId]`, `/anuncio/[id]/editar` | autenticada (middleware + checagem de dono) |

## API

Todas recebem/retornam JSON. Mutations exigem sessão Clerk válida.

| Método & Rota | Descrição |
|---------------|-----------|
| `GET /api/listings` | Lista com filtros: `q`, `categoria`, `tipo`, `condicao`, `status`, `regiao`, `precoMax`, `ordenar` (`recentes\|menor\|maior\|avaliacao`), `limite` |
| `POST /api/listings` | Cria anúncio (dono = sessão atual) |
| `GET/PATCH/DELETE /api/listings/[id]` | Detalhe / editar / excluir (**só o dono**) |
| `GET /api/favorites` · `POST` · `DELETE ?listingId=` | Favoritos do usuário logado |
| `GET /api/messages ?listingId=&userId=` | Thread entre os dois usuários num anúncio |
| `POST /api/messages` | Envia mensagem `{recipientId, listingId, text}` |
| `GET /api/messages/threads` | Conversas agrupadas (última mensagem) |
| `POST /api/ratings` | Avalia `{targetId, listingId, stars(1–5), comment}` |
| `POST /api/reports` | Denuncia `{reason, kind, listingId}` |
| `PATCH /api/profile` | Atualiza `name`, `region`, `bio` |
| `POST /api/webhooks/clerk` | Sync `user.created/updated/deleted` → tabela `users` (assinatura svix) |

## Sincronização de usuários (Clerk ↔ Supabase)

1. Usuário entra pelo `<SignIn/>` do Clerk.
2. Na primeira ação autenticada, `ensureMirroredUser()` cria a linha na tabela `users`.
3. Alterações de perfil no Clerk chegam pelo webhook `POST /api/webhooks/clerk` (validado com svix) e fazem upsert/delete.

## Deploy (referência)

- Hospedagem: Vercel, Hostinger Node hosting ou qualquer host com Node 22 (app na raiz do repositório).
- Supabase gerenciado (plano free atende) → ajustar `SUPABASE_URL` e keys.
- Variáveis de ambiente: as mesmas do `.env.example`.
- Apontar o webhook do Clerk para `https://SEU-DOMINIO/api/webhooks/clerk`.

## Convenções

- Rotas e copy da UI em português; código/identificadores em inglês.
- Server Components por padrão; `"use client"` só onde há interatividade.
- Entrada validada com zod; autorização sempre via `auth()` + ownership.
- Todas as queries ao banco usam `supabase` de `src/lib/supabase.ts` (service role, bypass RLS).
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client-side.
- Detalhes para agentes de IA: ver [`AGENTS.md`](AGENTS.md).
