# TASKS.md — Manifesto de Tarefas

> **Formato:** Cada tarefa é um bloco `## Task-XXXX` com campos obrigatórios.
> O agente lê este arquivo, executa em ordem, valida, e só avança se passar.

---

## Task-001 — Corrigir fotos dos produtos no anúncio

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
As fotos dos produtos não estão sendo colocadas quando o produto é anunciado. O fluxo de upload existe (`PhotoUploader.tsx` + `storage.ts`), mas algo está falhando no caminho entre o upload e a exibição.

### Problemas Identificados
1. **Arquivos órfãos no Storage ao editar** — ao remover fotos existentes no form, o arquivo continua no Supabase Storage (não há `deleteListingPhotoByPath`)
2. **Possível falha no fluxo de upload** — o `ListingForm` faz POST primeiro, depois upload das fotos, depois PATCH. Se o PATCH não chegar com as URLs corretas, as fotos somem
3. **`getPublicUrl()` não valida erro** — se o bucket estiver mal configurado, retorna URL quebrada sem aviso

### Critérios de Aceite
- [ ] Upload de fotos funciona ao criar anúncio (fotos aparecem no card e na página de detalhes)
- [ ] Upload de fotos funciona ao editar anúncio (fotos existentes permanecem, novas são adicionadas)
- [ ] Remover foto existente no form deleta o arquivo do Supabase Storage
- [ ] Mensagem de erro clara se upload falhar (não falha silenciosa)
- [ ] No máximo 5 fotos por anúncio (validação no client e server)
- [ ] Tipos aceitos: JPG, PNG, WebP (validação no client e server)

### Plano de Execução
1. Auditar `src/components/listing/ListingForm.tsx` — verificar fluxo de upload após POST
2. Auditar `src/components/listing/PhotoUploader.tsx` — verificar se `newFiles` são passados corretamente
3. Auditar `src/lib/storage.ts` — adicionar validação de erro em `getPublicUrl()`
4. Implementar remoção de arquivo do Storage ao deletar foto existente no form
5. Adicionar tratamento de erro mais visível no componente de upload
6. Testar fluxo completo: criar anúncio com fotos → ver no card → ver no detalhe → editar → remover foto → verificar Storage

### Validação
```bash
npx tsc --noEmit
npx eslint src/components/listing/PhotoUploader.tsx src/components/listing/ListingForm.tsx src/lib/storage.ts
npm run build
```

### Auto-Fix
> Se typecheck falhar → corrigir tipos. Se lint falhar → seguir sugestões do eslint.
> Max retries: 2. Se build falhar após 2 retries → marcar failed.

---

## Task-002 — Reorganizar layout da página inicial

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
O layout da página inicial precisa ficar mais parecido com uma plataforma de trocas e vendas. O layout atual tem hero + marquee + categorias + anúncios recentes, mas precisa de ajustes visuais e de informação.

### Problemas Identificados
1. **Hero genérico** — não comunica bem a proposta de troca/venda de materiais
2. **Sem indicadores de atividade** — não mostra quantos anúncios, usuários ou cidades ativas
3. **Busca no hero é um `<form>` com navegação full-page** — poderia ser mais fluida
4. **Categorias sem destaque visual** — grid simples, sem diferenciação
5. **Sem seção de "como funciona" visível** — o link existe mas não há preview na home

### Critérios de Aceite
- [ ] Hero comunica claramente a proposta: trocar e vender materiais escolares
- [ ] Barra de busca funciona e navega para `/anuncios?q=...`
- [ ] Grid de categorias com ícones e contagem de anúncios por categoria (se possível)
- [ ] Seção "Como funciona" com 3-4 passos visuais na home
- [ ] Anúncios recentes com cards limpos (foto + título + preço + região)
- [ ] Footer com links úteis (sobre, termos, contato)
- [ ] Layout responsivo: mobile first, bem adaptado

### Plano de Execução
1. Reescrever `src/app/page.tsx` com novo layout
2. Criar componente `src/components/home/HowItWorks.tsx` (passos visuais)
3. Criar componente `src/components/home/StatsBar.tsx` (indicadores de atividade)
4. Ajustar hero para comunicação mais direta
5. Manter seção de categorias e anúncios recentes
6. Adicionar footer se não existir no AppShell

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/page.tsx src/components/home/
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-003 — Corrigir sistema de chat (mensagens parecem da mesma pessoa)

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
As mensagens no chat parecem que são enviadas pela mesma pessoa. O bug foi identificado: `GET /api/messages` retorna campos em camelCase (`senderId`, `listingId`, `createdAt`), mas o hook `useRealtimeChat` e a página do chat esperam snake_case (`sender_id`, `listing_id`, `read_at`). Isso faz com que todas as mensagens iniciais apareçam como "recebidas" (alinhamento errado).

### Bug Confirmado
- `src/app/api/messages/route.ts` → mapeia para camelCase no GET
- `src/app/chat/[listingId]/[userId]/page.tsx` → usa `m.sender_id` para alinhar
- Resultado: `m.sender_id` é `undefined` → todas as mensagens aparecem do lado esquerdo

### Critérios de Aceite
- [ ] Mensagens enviadas pelo usuário aparecem à direita (verde/fundo próprio)
- [ ] Mensagens recebidas aparecem à esquerda (cinza/fundo do outro)
- [ ] Indicador "Lida"/"Enviada" funciona para mensagens enviadas
- [ ] Timestamp mostra horário correto em todas as mensagens
- [ ] Chat em tempo real funciona (mensagens novas aparecem sem reload)
- [ ] Scroll automático para baixo ao receber nova mensagem

### Plano de Execução
1. Corrigir `src/app/api/messages/route.ts` — unificar para snake_case no GET
2. Verificar `src/app/chat/[listingId]/[userId]/page.tsx` — garantir que usa snake_case
3. Verificar `src/hooks/useRealtimeChat.ts` — garantir consistência
4. Testar fluxo: enviar mensagem → verificar alinhamento → receber resposta → verificar alinhamento
5. Verificar indicador de leitura (read_at)

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/api/messages/route.ts src/app/chat/[listingId]/[userId]/page.tsx src/hooks/useRealtimeChat.ts
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-004 — Corrigir sistema de avaliação e perfil

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
O sistema de avaliação e perfil não está funcionando. Problemas identificados:
1. Campo `bio` não é editável na UI (API aceita, mas `ProfileClient` não mostra textarea)
2. Possíveis problemas de integração entre Clerk e Supabase para dados do perfil
3. Sistema de avaliações pode ter problemas de exibição

### Critérios de Aceite
- [ ] Página `/perfil` mostra dados do usuário corretamente (nome, email, região, bio)
- [ ] Edição de nome funciona (PATCH `/api/profile`)
- [ ] Edição de região funciona
- [ ] Edição de bio funciona (textarea na UI)
- [ ] Avaliações recebidas aparecem na página de perfil
- [ ] Página pública `/usuario/[id]` mostra avaliações corretamente
- [ ] Criar avaliação funciona (a partir do chat, "Negociação concluída?")
- [ ] Média de estrelas é calculada corretamente
- [ ] Usuário não pode avaliar a si mesmo

### Plano de Execução
1. Auditar `src/components/profile/ProfileClient.tsx` — adicionar campo bio no form
2. Auditar `src/app/api/profile/route.ts` — garantir que bio é salvo
3. Auditar `src/app/api/ratings/route.ts` — garantir que avaliações são criadas e retornadas
4. Auditar `src/app/perfil/page.tsx` — garantir que dados são carregados
5. Auditar `src/app/usuario/[id]/page.tsx` — garantir que avaliações aparecem
6. Verificar integração Clerk ↔ Supabase (webhook + ensureMirroredUser)
7. Testar: editar perfil → verificar salvamento → criar avaliação → verificar exibição

### Validação
```bash
npx tsc --noEmit
npx eslint src/components/profile/ProfileClient.tsx src/app/api/profile/route.ts src/app/api/ratings/route.ts src/app/perfil/page.tsx src/app/usuario/[id]/page.tsx
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-005 — Implementar seletor de estados e cidades

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
Na opção de colocar cidade, substituir o campo de texto livre por um seletor estruturado com estados brasileiros e suas cidades. Hoje o campo `region` é texto livre (`varchar(120)`), o que gera inconsistências ("Sao Paulo", "SP", "São Paulo - SP").

### Critérios de Aceite
- [ ] Campo de estado: dropdown com todos os 27 estados brasileiros (UF)
- [ ] Campo de cidade: dropdown que filtra cidades do estado selecionado
- [ ] Dados de cidades vêm do IBGE (API ou JSON estático)
- [ ] Campo `region` no banco salva no formato "Cidade - UF" (ex: "São Paulo - SP")
- [ ] Formulário de criar/editar anúncio usa os novos selects
- [ ] Formulário de perfil usa os novos selects
- [ ] Filtros de busca usam os novos selects (ou mantêm compatibilidade com texto)
- [ ] Validação: estado e cidade são obrigatórios ao criar anúncio
- [ ] Dados das cidades carregam de forma eficiente (JSON estático ou cache)

### Plano de Execução
1. Criar arquivo `src/lib/locations.ts` com lista de estados e cidades (JSON do IBGE)
2. Criar componente `src/components/StateCitySelect.tsx` (dois dropdowns encadeados)
3. Atualizar `src/components/listing/ListingForm.tsx` — substituir input de região
4. Atualizar `src/components/profile/ProfileClient.tsx` — substituir input de região
5. Atualizar `src/components/ListingFilters.tsx` — usar selects na busca
6. Verificar compatibilidade com `listings-query.ts` (ILIKE continua funcionando)
7. Testar: criar anúncio com estado/cidade → verificar no card → verificar na busca

### Validação
```bash
npx tsc --noEmit
npx eslint src/lib/locations.ts src/components/StateCitySelect.tsx src/components/listing/ListingForm.tsx src/components/profile/ProfileClient.tsx src/components/ListingFilters.tsx
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-006 — Schema: adicionar roles, admin_actions, banned_at, featured

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
Preparar o banco de dados para o painel admin adicionando as estruturas necessárias: role de admin nas denúncias, tabela de log de ações admin, possibility de banir usuários e destaque de anúncios.

### Critérios de Aceite
- [ ] Coluna `users.role` adicionada (enum `user_role`: user, admin)
- [ ] Coluna `users.banned_at` e `users.ban_reason` adicionadas
- [ ] Coluna `reports.status` adicionada (pendente/revisado/dispensado/aceito)
- [ ] Colunas `reports.reviewed_by`, `reports.reviewed_at`, `reports.note` adicionadas
- [ ] Tabela `admin_actions` criada com indexes
- [ ] Coluna `listings.featured` adicionada
- [ ] Primeiro admin promovido via SQL

### Plano de Execução
1. Criar arquivo `docs/migrations/20260904-admin-schema.sql`
2. Executar SQL no Supabase Dashboard
3. Atualizar `src/lib/supabase-types.ts` com novos tipos
4. Atualizar `docs/schema.sql` com as mudanças

### Validação
```bash
npx tsc --noEmit
```

### Auto-Fix
> Max retries: 2

---

## Task-007 — Auth: helper isAdmin() + middleware admin + API check

**Depends:** [Task-006]
**Priority:** high
**Status:** pending

### Objetivo
Criar o sistema de verificação de role admin: helper server-side, proteção de middleware, e API endpoint para verificação.

### Critérios de Aceite
- [ ] Função `isAdmin()` em `src/lib/server-user.ts` consulta role no banco
- [ ] Middleware adiciona `/admin(.*)` nas rotas protegidas
- [ ] Rota `GET /api/admin/check` retorna `{ admin: true/false }`
- [ ] Todas as rotas admin futuras podem usar `isAdmin()` como gate

### Plano de Execução
1. Adicionar `isAdmin()` em `src/lib/server-user.ts`
2. Atualizar `src/middleware.ts` — adicionar `/admin(.*)` no matcher
3. Criar `src/app/api/admin/check/route.ts`
4. Testar: acessar /admin sem login → redireciona; com login normal → redireciona; com admin → acesso

### Validação
```bash
npx tsc --noEmit
npx eslint src/lib/server-user.ts src/middleware.ts src/app/api/admin/check/route.ts
```

### Auto-Fix
> Max retries: 2

---

## Task-008 — Layout admin: sidebar + proteção de rotas

**Depends:** [Task-007]
**Priority:** high
**Status:** pending

### Objetivo
Criar o layout do painel admin com sidebar de navegação e proteção automática (redireciona não-admins).

### Critérios de Aceite
- [ ] `src/app/admin/layout.tsx` existe com sidebar
- [ ] Sidebar mostra links: Dashboard, Denúncias, Usuários, Anúncios, Chat, Config
- [ ] Badge de contagem de denúncias pendentes na sidebar
- [ ] Layout verifica role via `GET /api/admin/check` antes de renderizar
- [ ] Se não for admin → redireciona para `/`
- [ ] Link "Voltar ao site" na sidebar
- [ ] Layout responsivo (sidebar colapsa no mobile)

### Plano de Execução
1. Criar `src/components/admin/Sidebar.tsx`
2. Criar `src/app/admin/layout.tsx` com verificação de role
3. Estilizar com Tailwind (seguindo o design system existente)
4. Testar: acessar /admin como admin → vê sidebar; como não-admin → redireciona

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/admin/layout.tsx src/components/admin/Sidebar.tsx
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-009 — Dashboard: API stats + página com métricas

**Depends:** [Task-008]
**Priority:** high
**Status:** pending

### Objetivo
Criar o dashboard administrativo com métricas gerais da plataforma: usuários, anúncios, denúncias, mensagens, gráficos e top categorias/regiões.

### Critérios de Aceite
- [ ] Rota `GET /api/admin/stats` retorna métricas agregadas
- [ ] Métricas: total de usuários (hoje/7d/30d), anúncios ativos, denúncias pendentes, mensagens
- [ ] Gráfico de linha: usuários, anúncios e mensagens por dia (últimos 30 dias)
- [ ] Top 5 categorias com mais anúncios
- [ ] Top 5 regiões com mais anúncios
- [ ] Cards de métricas no topo da página
- [ ] Layout responsivo

### Plano de Execução
1. Criar `src/app/api/admin/stats/route.ts`
2. Criar `src/components/admin/StatsCard.tsx`
3. Instalar `recharts` para gráficos
4. Criar `src/app/admin/page.tsx` com dashboard
5. Testar: acessar /admin como admin → vê métricas

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/api/admin/stats/route.ts src/app/admin/page.tsx src/components/admin/StatsCard.tsx
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-010 — Denúncias: API CRUD + lista + detalhe + ações

**Depends:** [Task-008]
**Priority:** high
**Status:** pending

### Objetivo
Sistema completo de moderação de denúncias: listar, filtrar, ver detalhe, e tomar ações (dispensar, ocultar anúncio, banir usuário).

### Critérios de Aceite
- [ ] `GET /api/admin/reports` lista denúncias com filtros (status, tipo)
- [ ] `GET /api/admin/reports/[id]` retorna detalhe da denúncia
- [ ] `PATCH /api/admin/reports/[id]` atualiza status + executa ação
- [ ] Página `/admin/denuncias` mostra tabela com badges de status
- [ ] Página `/admin/denuncias/[id]` mostra detalhe + botões de ação
- [ ] Modal de confirmação para ações destrutivas
- [ ] Campo de nota administrativa
- [ ] Link direto para listing/usuário denunciado
- [ ] Badge de contagem pendente na sidebar

### Plano de Execução
1. Criar `src/app/api/admin/reports/route.ts` (GET list)
2. Criar `src/app/api/admin/reports/[id]/route.ts` (GET detail, PATCH update)
3. Criar `src/components/admin/DataTable.tsx` (genérico)
4. Criar `src/components/admin/ConfirmDialog.tsx`
5. Criar `src/app/admin/denuncias/page.tsx` (lista)
6. Criar `src/app/admin/denuncias/[id]/page.tsx` (detalhe)
7. Testar: listar denúncias → ver detalhe → dispensar → verificar status

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/api/admin/reports/ src/app/admin/denuncias/ src/components/admin/
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-011 — Usuários: API CRUD + lista + detalhe + banir/promover

**Depends:** [Task-008]
**Priority:** high
**Status:** pending

### Objetivo
Gestão de usuários: listar, buscar, ver detalhes, banir/desbanir, promover/rebaixar admin.

### Critérios de Aceite
- [ ] `GET /api/admin/users` lista usuários com busca e filtros
- [ ] `GET /api/admin/users/[id]` retorna detalhe (perfil, stats, denúncias)
- [ ] `PATCH /api/admin/users/[id]` permite banir/desbanir/promover
- [ ] Página `/admin/usuarios` mostra tabela com busca
- [ ] Página `/admin/usuarios/[id]` mostra detalhe + ações
- [ ] Badge "Banido" aparece ao lado do nome se banned
- [ ] Modal de confirmação para banir/promover
- [ ] Log de ação em `admin_actions`

### Plano de Execução
1. Criar `src/app/api/admin/users/route.ts` (GET list)
2. Criar `src/app/api/admin/users/[id]/route.ts` (GET detail, PATCH update)
3. Criar `src/app/admin/usuarios/page.tsx` (lista)
4. Criar `src/app/admin/usuarios/[id]/page.tsx` (detalhe)
5. Testar: listar usuários → ver detalhe → banir → verificar badge

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/api/admin/users/ src/app/admin/usuarios/
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-012 — Anúncios: API CRUD + lista + detalhe + moderar

**Depends:** [Task-008]
**Priority:** high
**Status:** pending

### Objetivo
Gestão de anúncios: listar, buscar, ver detalhes, ocultar/restaurar, destacar/remover destaque.

### Critérios de Aceite
- [ ] `GET /api/admin/listings` lista anúncios com busca e filtros
- [ ] `GET /api/admin/listings/[id]` retorna detalhe (fotos, vendedor, denúncias)
- [ ] `PATCH /api/admin/listings/[id]` permite ocultar/restaurar/destacar
- [ ] Página `/admin/anuncios` mostra tabela com busca
- [ ] Página `/admin/anuncios/[id]` mostra detalhe + ações
- [ ] Badge "Destacado" aparece se featured
- [ ] Modal de confirmação para ocultar
- [ ] Log de ação em `admin_actions`

### Plano de Execução
1. Criar `src/app/api/admin/listings/route.ts` (GET list)
2. Criar `src/app/api/admin/listings/[id]/route.ts` (GET detail, PATCH update)
3. Criar `src/app/admin/anuncios/page.tsx` (lista)
4. Criar `src/app/admin/anuncios/[id]/page.tsx` (detalhe)
5. Testar: listar anúncios → ver detalhe → ocultar → verificar status

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/api/admin/listings/ src/app/admin/anuncios/
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-013 — Chat admin: API threads + visualização readonly

**Depends:** [Task-008]
**Priority:** medium
**Status:** pending

### Objetivo
Permitir que admins monitorem conversas entre usuários (somente leitura).

### Critérios de Aceite
- [ ] `GET /api/admin/chat/threads` lista todas as conversas
- [ ] `GET /api/admin/chat/[listingId]/[userId]` retorna mensagens
- [ ] Página `/admin/chat` mostra lista de conversas
- [ ] Página `/admin/chat/[listingId]/[userId]` mostra conversa (readonly)
- [ ] Admin não pode enviar mensagens
- [ ] Indicador de qual usuário é qual (cores diferentes)
- [ ] Busca por nome de usuário ou título do listing

### Plano de Execução
1. Criar `src/app/api/admin/chat/threads/route.ts`
2. Criar `src/app/api/admin/chat/[listingId]/[userId]/route.ts`
3. Criar `src/app/admin/chat/page.tsx` (lista)
4. Criar `src/app/admin/chat/[listingId]/[userId]/page.tsx` (visualizar)
5. Testar: listar conversas → ver mensagem → verificar readonly

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/api/admin/chat/ src/app/admin/chat/
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-014 — Config + polish final

**Depends:** [Task-009, Task-010, Task-011, Task-012]
**Priority:** low
**Status:** pending

### Objetivo
Página de configurações e ajustes finais no painel admin.

### Critérios de Aceite
- [ ] Página `/admin/config` existe com info da versão
- [ ] Link para dashboard do Supabase
- [ ] Todas as páginas admin funcionam sem erros
- [ ] Sidebar funciona em todas as páginas
- [ ] Layout responsivo em todas as páginas
- [ ] Nenhum erro de lint ou typecheck

### Plano de Execução
1. Criar `src/app/admin/config/page.tsx`
2. Revisar todas as páginas admin
3. Rodar lint e typecheck gerais
4. Testar fluxo completo

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/admin/
npm run build
```

### Auto-Fix
> Max retries: 2

---

---

## Task-015 — Remover force-dynamic do layout.tsx

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
O layout raiz (`src/app/layout.tsx`) tem `export const dynamic = 'force-dynamic'` na linha 17, o que força todas as páginas a serem Server-Sent/SSR e impede caching estático. Essa configuração não é necessária no layout — cada página deve decidir individualmente.

### Critérios de Aceite
- [ ] `export const dynamic = 'force-dynamic'` removido de `src/app/layout.tsx`
- [ ] Nenhuma página quebra após remoção
- [ ] `npx tsc --noEmit` passa sem erros

### Plano de Execução
1. Ler `src/app/layout.tsx` e identificar a linha com `export const dynamic = 'force-dynamic'`
2. Remover a linha
3. Rodar typecheck para garantir que nada quebrou

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → verificar se alguma página dependia do layout dynamic. Max retries: 2

---

## Task-016 — Configurar next.config.mjs

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
O `next.config.mjs` está vazio (`{}`). Precisa configurar `images.remotePatterns` para permitir imagens do Supabase Storage e adicionar headers de segurança.

### Critérios de Aceite
- [ ] `images.remotePatterns` configurado para o domínio do Supabase Storage
- [ ] Security headers configurados (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [ ] `npm run build` passa sem erros

### Plano de Execução
1. Ler `next.config.mjs` atual
2. Adicionar `images.remotePatterns` com o padrão do Supabase Storage (formato `https://*.supabase.co`)
3. Adicionar headers de segurança via `headers()` config
4. Rodar build para validar

### Validação
```bash
npm run build
npx tsc --noEmit
```

### Auto-Fix
> Se build falhar → verificar se remotePatterns está correto. Max retries: 2

---

## Task-017 — Substituir <img> por next/image

**Depends:** [Task-016]
**Priority:** high
**Status:** pending

### Objetivo
Vários componentes usam tags `<img>` nativas em vez de `next/image`, perdendo otimização automática (lazy loading, formatação WebP, responsive sizing). Substituir por `Image` do Next.js nos componentes principais.

### Componentes-alvo
- `src/components/ListingCard.tsx` (linha 31-36)
- `src/components/listing/SimilarListings.tsx` (linha 47-51)
- `src/app/usuario/[id]/page.tsx` (linha 49-53)

### Critérios de Aceite
- [ ] Todas as tags `<img>` nos componentes-alvo substituídas por `Image` do `next/image`
- [ ] `width` e `height` ou `fill` configurados corretamente
- [ ] `alt` text preservado
- [ ] `className` de estilo mantido
- [ ] `npx tsc --noEmit` e `npm run build` passam

### Plano de Execução
1. Substituir `<img>` por `Image` em `ListingCard.tsx`
2. Substituir `<img>` por `Image` em `SimilarListings.tsx`
3. Substituir `<img>` por `Image` em `usuario/[id]/page.tsx`
4. Rodar typecheck e build

### Validação
```bash
npx tsc --noEmit
npm run build
```

### Auto-Fix
> Se typecheck falhar → ajustar props do Image. Max retries: 2

---

## Task-018 — Adicionar error.tsx às rotas principais

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
Nenhuma rota tem `error.tsx`, então erros de renderização mostram a página de erro genérica do Next.js. Criar `error.tsx` nas rotas principais com UI amigável.

### Critérios de Aceite
- [ ] `src/app/error.tsx` criado com UI de erro amigável
- [ ] `src/app/anuncios/error.tsx` criado
- [ ] `src/app/chat/error.tsx` criado
- [ ] Cada error.tsx tem botão "Tentar novamente" que chama `reset()`
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Criar `src/app/error.tsx` — componente client com mensagem de erro + botão retry
2. Criar `src/app/anuncios/error.tsx` — variante específica para busca
3. Criar `src/app/chat/error.tsx` — variante específica para chat
4. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → verificar se 'use client' está presente. Max retries: 2

---

## Task-019 — Adicionar loading.tsx às rotas principais

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
Nenhuma rota tem `loading.tsx`, então o usuário não vê feedback visual durante carregamento de Server Components. Criar skeletons de carregamento nas rotas principais.

### Critérios de Aceite
- [ ] `src/app/loading.tsx` criado com skeleton da homepage
- [ ] `src/app/anuncios/loading.tsx` criado com skeleton de grid
- [ ] `src/app/chat/loading.tsx` criado com skeleton de conversas
- [ ] Skeletons seguem o design system (cores, border-radius do Tailwind)
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Criar `src/app/loading.tsx` com skeleton da homepage (hero + cards)
2. Criar `src/app/anuncios/loading.tsx` com skeleton de grid de listings
3. Criar `src/app/chat/loading.tsx` com skeleton de lista de conversas
4. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → verificar se 'use client' não é necessário (loading.tsx pode ser server). Max retries: 2

---

## Task-020 — Integrar Sentry para monitoramento de erros

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
Não há monitoramento de erros em produção. Integrar Sentry para capturar erros automaticamente e receber alertas.

### Critérios de Aceite
- [ ] `@sentry/nextjs` instalado
- [ ] `sentry.client.config.ts` e `sentry.server.config.ts` criados
- [ ] `next.config.mjs` atualizado com plugin Sentry
- [ ] Variáveis de ambiente `SENTRY_DSN` documentadas (não expostas)
- [ ] `npm run build` passa

### Plano de Execução
1. Instalar `@sentry/nextjs`
2. Rodar `npx @sentry/wizard@latest -i nextjs` ou configurar manualmente
3. Criar arquivos de config do Sentry
4. Atualizar `next.config.mjs` com wrap de export
5. Adicionar `.env.example` com placeholder `SENTRY_DSN`
6. Rodar build

### Validação
```bash
npm run build
npx tsc --noEmit
```

### Auto-Fix
> Se build falhar → verificar se plugin Sentry está configurado corretamente. Max retries: 2

---

## Task-021 — Sistema de notificações

**Depends:** [Task-015]
**Priority:** high
**Status:** pending

### Objetivo
Não há sistema de notificações. Usuários não são avisados sobre novas mensagens, favoritos recebidos ou atualizações de anúncios. Criar um sistema básico de notificações in-app.

### Critérios de Aceite
- [ ] Tabela `notifications` criada via migration SQL
- [ ] API CRUD para notificações (`/api/notifications`)
- [ ] Componente de sino/badge no header com contagem de não-lidas
- [ ] Página `/notificacoes` com lista e marcar como lida
- [ ] Notificações criadas automaticamente ao receber mensagem
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Criar migration SQL para tabela `notifications` (id, user_id, type, title, body, read_at, listing_id, created_at)
2. Atualizar `supabase-types.ts` com o novo tipo
3. Criar API `/api/notifications` (GET lista, PATCH marca lida)
4. Criar componente `NotificationBell` com badge de contagem
5. Adicionar NotificationBell ao header em `AppShell.tsx`
6. Criar página `/notificacoes/page.tsx`
7. Integrar criação de notificação na API de mensagens

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos. Max retries: 2

---

## Task-022 — Expiração e renovação de anúncios

**Depends:** [Task-015]
**Priority:** high
**Status:** pending

### Objetivo
Anúncios ficam ativos indefinidamente, poluindo a busca com materiais antigos. Implementar expiração automática após 30 dias e permiteção de renovação pelo dono.

### Critérios de Aceite
- [ ] Coluna `expires_at` adicionada na tabela `listings` (migration SQL)
- [ ] Anúncios expiram automaticamente após 30 dias (status muda para `expirado`)
- [ ] Botão "Renovar" aparece no perfil do dono para anúncios expirados
- [ ] Renovação atualiza `expires_at` por mais 30 dias e volta status para `ativo`
- [ ] Busca (`searchListings`) exclui anúncios expirados
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Criar migration SQL para adicionar `expires_at` em `listings`
2. Atualizar `supabase-types.ts`
3. Criar API `/api/listings/[id]/renew` (PATCH)
4. Atualizar `ProfileClient.tsx` para mostrar botão renovar
5. Atualizar `searchListings` para filtrar expirados
6. Criar cron/task para marcar expirados (ou checar no query)

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos. Max retries: 2

---

## Task-023 — Bloquear e denunciar usuário

**Depends:** [Task-006]
**Priority:** medium
**Status:** pending

### Objetivo
Já existe denúncia de anúncios, mas não de usuários. Implementar bloqueio de usuário (impede mensagens) e denúncia de perfil.

### Critérios de Aceite
- [ ] Tabela `blocked_users` criada (blocker_id, blocked_id, created_at)
- [ ] API `/api/users/[id]/block` (POST bloqueia, DELETE desbloqueia)
- [ ] API `/api/reports` aceita `kind: 'usuario'` com `targetUserId`
- [ ] Usuário bloqueado não pode enviar mensagens
- [ ] Botão "Bloquear" no perfil público do usuário
- [ ] Botão "Denunciar perfil" no perfil público
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Criar migration SQL para `blocked_users`
2. Criar API de block/unblock
3. Atualizar API de reports para aceitar denúncia de usuário
4. Atualizar `usuario/[id]/page.tsx` com botões bloquear/denunciar
5. Atualizar API de mensagens para checar bloqueio

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos. Max retries: 2

---

## Task-024 — Sinais de confiança no perfil e anúncio

**Depends:** [Task-015]
**Priority:** medium
**Status:** pending

### Objetivo
Usuários novos têm dificuldade em gerar confiança. Adicionar sinais visuais de verificação e atividade para aumentar conversão.

### Critérios de Aceite
- [ ] Badge "Membro desde [mês/ano]" no perfil público
- [ ] Badge "Responde rápido" se último_seen_at < 24h
- [ ] Contador de anúncios ativos no perfil
- [ ] Indicador "Verificado" se email confirmado no Clerk
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Atualizar `usuario/[id]/page.tsx` para mostrar "Membro desde"
2. Adicionar lógica de "Responde rápido" baseada em `last_seen_at`
3. Adicionar contador de anúncios ativos
4. Buscar status de verificação do Clerk (via API ou campo)
5. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos. Max retries: 2

---

## Task-025 — Anúncios em destaque

**Depends:** [Task-012]
**Priority:** medium
**Status:** pending

### Objetivo
O campo `featured` já existe na tabela `listings` (criado no Task-006), mas não é utilizado na UI. Implementar exibição de anúncios destacados na homepage e busca.

### Critérios de Aceite
- [ ] Homepage mostra seção "Destaques" com anúncios featured
- [ ] Na busca, anúncios featured aparecem primeiro (antes dos normais)
- [ ] Badge visual "Destaque" nos cards de anúncios featured
- [ ] Admin pode marcar/desmarcar featured (já existe no admin)
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Atualizar `src/app/page.tsx` para buscar e exibir anúncios featured
2. Criar componente `FeaturedBadge` para o card
3. Atualizar `searchListings` para ordenar featured primeiro
4. Adicionar badge ao `ListingCard.tsx`
5. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos. Max retries: 2

---

## Task-026 — Autocomplete na busca

**Depends:** []
**Priority:** medium
**Status:** pending

### Objetivo
O `SearchBar` não tem autocomplete, o que dificulta a digitação e descoberta de termos. Implementar sugestões automáticas baseadas em títulos de anúncios existentes.

### Critérios de Aceite
- [ ] API `/api/search/suggestions?q=...` retorna até 5 sugestões
- [ ] SearchBar mostra dropdown com sugestões ao digitar
- [ ] Sugestões aparecem após 2+ caracteres
- [ ] Debounce de 300ms nas requisições
- [ ] Selecionar sugestão navega para busca
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Criar API `/api/search/suggestions` que busca títulos similares
2. Atualizar `SearchBar.tsx` com estado de sugestões
3. Adicionar debounce (useEffect + setTimeout)
4. Adicionar dropdown de sugestões
5. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos. Max retries: 2

---

## Task-027 — Timestamps no chat + fix mobile

**Depends:** []
**Priority:** medium
**Status:** pending

### Objetivo
O chat não mostra horários das mensagens e o mobile bottom nav cobre parte do chat. Corrigir ambos.

### Critérios de Aceite
- [ ] Cada mensagem mostra timestamp (HH:MM) abaixo ou ao lado
- [ ] Timestamp usa locale pt-BR
- [ ] Mobile: chat tem padding-bottom para não ficar atrás do nav fixo
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Ler `src/app/chat/[listingId]/[userId]/page.tsx`
2. Adicionar formatação de timestamp nas mensagens
3. Adicionar `pb-20` ou similar ao container do chat para mobile
4. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar formatação. Max retries: 2

---

## Task-028 — Substituir polling por Supabase Realtime

**Depends:** [Task-027]
**Priority:** medium
**Status:** pending

### Objetivo
O `UnreadBadge` usa polling (setInterval a cada 15s) para checar mensagens não lidas. Isso é ineficiente. Substituir por Supabase Realtime para atualizações instantâneas.

### Critérios de Aceite
- [ ] `UnreadBadge` usa Supabase Realtime channel em vez de polling
- [ ] Badge atualiza instantaneamente ao receber nova mensagem
- [ ] Sem memory leak (channel desinscreve ao desmontar)
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Ler `src/components/UnreadBadge.tsx`
2. Substituir setInterval por `supabase.channel('unread')` com `.on('postgres_changes', ...)`
3. Garantir cleanup no useEffect return
4. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar tipos do Realtime. Max retries: 2

---

## Task-029 — Auditoria de acessibilidade

**Depends:** []
**Priority:** medium
**Status:** pending

### Objetivo
Fazer auditoria básica de acessibilidade (WCAG 2.1 AA) nos componentes principais e corrigir problemas críticos.

### Critérios de Aceite
- [ ] Todos os botões têm `aria-label` quando usam só ícone
- [ ] Inputs de formulário têm `htmlFor` + `id` associados
- [ ] Contraste de cores passa no WCAG AA (4.5:1 para texto)
- [ ] Navegação por teclado funciona em modais e formulários
- [ ] `role` correto em componentes interativos
- [ ] `npx tsc --noEmit` passa

### Plano de Execução
1. Auditar `AppShell.tsx` — navegação, aria-labels
2. Auditar `ListingCard.tsx` — links, alt texts
3. Auditar `ListingForm.tsx` — labels, aria
4. Auditar `ListingActions.tsx` — botões
5. Auditar `StarRating.tsx` — aria-labels
6. Corrigir problemas encontrados
7. Rodar typecheck

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Se typecheck falhar → ajustar props. Max retries: 2

---

## Task-030 — Headers de segurança avançados

**Depends:** [Task-016]
**Priority:** medium
**Status:** pending

### Objetivo
Complementar os headers básicos do Task-016 com headers avançados de segurança para proteção contra ataques comuns.

### Critérios de Aceite
- [ ] `Content-Security-Policy` configurado (pelo menos script-src e style-src)
- [ ] `Strict-Transport-Security` (HSTS) habilitado
- [ ] `X-XSS-Protection` habilitado
- [ ] `Permissions-Policy` restritivo (câmera, mic, geolocalização desabilitados)
- [ ] `npm run build` passa

### Plano de Execução
1. Ler `next.config.mjs` atual (já atualizado no Task-016)
2. Adicionar CSP headers via `headers()` config
3. Adicionar HSTS, X-XSS-Protection, Permissions-Policy
4. Testar que não quebra assets existentes
5. Rodar build

### Validação
```bash
npm run build
npx tsc --noEmit
```

### Auto-Fix
> Se build falhar → ajustar CSP para permitir fontes necessárias. Max retries: 2

---

<!-- 
## TEMPLATE — Copie e cole para novas tarefas:

## Task-XXXX — [Título]

**Depends:** [] ou [Task-YYY, Task-ZZZ]
**Priority:** high | medium | low
**Status:** pending

### Objetivo
> O que precisa ser feito.

### Critérios de Aceite
- [ ] Critério mensurável 1
- [ ] Critério mensurável 2

### Plano de Execução
1. Passo 1
2. Passo 2

### Validação
```bash
comando de validação
```

### Auto-Fix
> Estratégia de auto-correção. Max retries: 2

-->
