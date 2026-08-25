# ReEduca

Plataforma onde estudantes **vendem, trocam ou doam** materiais escolares — livros, apostilas, cadernos, mochilas, calculadoras e equipamentos — direto com quem estuda perto deles.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Banco de dados | MySQL 8 + Prisma ORM 6 |
| Autenticação | Clerk (`@clerk/nextjs`) com espelho de usuários no MySQL |
| Estilo | Tailwind CSS 3 (design system próprio em `globals.css`) |
| Validação | Zod em toda Route Handler |

## Requisitos

- Node.js **22** (ver `.nvmrc`)
- MySQL 8 rodando localmente
- Conta no [Clerk](https://clerk.com) (plano free atende)

## Configuração

```bash
npm install                # instala workspaces (raiz + apps/web)
cp apps/web/.env.example apps/web/.env   # depois edite com seus valores
```

Preencha o `apps/web/.env`:

```env
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/reduca"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."   # dashboard.clerk.com → API Keys
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."                  # só se for testar webhooks localmente
```

Crie o banco e popule com dados demo:

```bash
cd apps/web
npx prisma migrate dev        # cria as tabelas (migration init já versionada)
npx prisma db seed            # 6 usuários demo + 6 anúncios de exemplo
```

> O Prisma cria todas as tabelas automaticamente a partir de `prisma/schema.prisma`. Para explorar os dados use `npx prisma studio`.

## Executando

Todos os comandos podem ser rodados pela raiz do monorepo ou dentro de `apps/web`.

| Tarefa | Comando (raiz) |
|--------|----------------|
| Desenvolvimento | `npm run dev` → http://localhost:3000 |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Build de produção | `npm run build` |
| Servir build | `npm start` |
| Migration | `npx prisma migrate dev --schema apps/web/prisma/schema.prisma --name <nome>` |
| Seed | `npx prisma db seed --schema apps/web/prisma/schema.prisma` |

## Estrutura

```
apps/web/src/
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
    ├── db.ts                  # singleton PrismaClient (só servidor)
    ├── reeduca.ts             # constantes de domínio + helpers + serialização
    ├── validators.ts          # schemas zod das rotas
    └── server-user.ts         # espelho do usuário Clerk na tabela User
prisma/
├── schema.prisma              # fonte da verdade do banco
└── seed.js
```

## Modelo de dados

| Tabela | Função |
|--------|--------|
| `user` | Espelho dos usuários do Clerk (`id` = userId Clerk) + `region`, `bio` |
| `listing` | Anúncio: título, categoria, tipo (venda/troca/doação), condição, preço, região, status, `photoUrls` (links) |
| `favorite` | Favorito (par único usuário+anúncio) |
| `message` | Mensagens do chat entre dois usuários sobre um anúncio |
| `rating` | Avaliação 1–5 estrelas de um usuário para outro |
| `report` | Denúncia de anúncio ou usuário |

Relações usam `onDelete: Cascade` (ex.: apagar usuário apaga seus anúncios/favoritos/mensagens).

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
| `POST /api/webhooks/clerk` | Sync `user.created/updated/deleted` → tabela `user` (assinatura svix) |

## Sincronização de usuários (Clerk ↔ MySQL)

1. Usuário entra pelo `<SignIn/>` do Clerk.
2. Na primeira ação autenticada, `ensureMirroredUser()` cria a linha na tabela `user`.
3. Alterações de perfil no Clerk chegam pelo webhook `POST /api/webhooks/clerk` (validado com svix) e fazem upsert/delete.

## Deploy (referência)

- Hospedagem: Vercel (projeto = `apps/web`) ou qualquer host Node.
- MySQL gerenciado (PlanetScale-like, RDS, etc.) → ajustar `DATABASE_URL`.
- Variáveis de ambiente: as mesmas do `.env.example`.
- Apontar o webhook do Clerk para `https://SEU-DOMINIO/api/webhooks/clerk`.

## Convenções

- Rotas e copy da UI em português; código/identificadores em inglês.
- Server Components por padrão; `"use client"` só onde há interatividade.
- Entrada validada com zod; autorização sempre via `auth()` + ownership.
- Detalhes para agentes de IA: ver [`AGENTS.md`](AGENTS.md).
