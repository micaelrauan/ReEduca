# Plano de Recursos — Sistema de Anúncios

> Status: **Aprovado** — Implementando Fases 1 e 2
> Criado: 2026-08-26
> Decisões: Supabase Storage ✅ | Supabase Realtime ✅ | Resend (futuro) | Admin (futuro) | Moderação manual ✅ | Sem dark mode

---

## 1. Visão Geral

Este plano define os recursos a serem implementados no sistema de anúncios do Reeduca, cobrindo desde a publicação até a conclusão de uma negociação. Baseado em pesquisa de sistemas reais (OLX, Mercado Livre, Facebook Marketplace, Varaposto) e no estado atual do código.

### O que já existe
- CRUD completo de anúncios (criar, ler, atualizar, deletar)
- Busca com filtros (categoria, tipo de negócio, condição, região, preço, ordenação)
- Favoritos com optimistic updates
- Chat básico com polling a cada 4 segundos
- Sistema de avaliação (estrelas 1-5, sem comentário)
- Denúncia (backend apenas)
- Perfil do usuário (edição de nome/região)

### O que falta (resumo)
- Upload de fotos (atualmente só URLs manuais)
- Paginação na busca
- Chat em tempo real
- Indicador de mensagens não lidas
- Avaliação com texto e prevenção de duplicatas
- Página de perfil pública de outro usuário
- Fluxo de conclusão de venda
- Moderação/administração
- Notificações

---

## 2. Fases de Implementação

### Fase 1 — Upload de Fotos ⭐ Prioridade Alta
**Problema:** Usuários precisam colar URLs externas manualmente.

**Solução:** Integrar Supabase Storage para upload de imagens.

| Item | Detalhe |
|------|---------|
| Criar bucket `listing-photos` no Supabase Storage | Política: authenticated upload, public read |
| Componente `PhotoUploader` | Drag & drop ou click, preview, crop básico, max 5 fotos |
| Compressão client-side | Usar `browser-image-compression` antes do upload (max 1MB por foto) |
| Caminho no Storage | `listings/{listingId}/{index}.jpg` |
| Atualizar `ListingForm` | Substituir input de URL por uploader |
| Atualizar `Gallery` | Usar URLs do Supabase Storage |
| Limpeza automática | Deletar fotos do Storage quando anúncio é deletado (trigger ou API) |

**Arquivos afetados:**
- Novo: `src/components/listing/PhotoUploader.tsx`
- Editar: `src/components/listing/ListingForm.tsx`, `src/components/listing/Gallery.tsx`
- Editar: `src/app/api/listings/[id]/route.ts` (DELETE deve limpar Storage)
- Novo: `src/lib/storage.ts` (helper para upload)

---

### Fase 2 — Paginação e Busca ⭐ Prioridade Alta
**Problema:** `searchListings` retorna até 200 resultados sem paginação.

**Solução:** Paginação baseada em cursor ou offset.

| Item | Detalhe |
|------|---------|
| Offset pagination | Parâmetros `page` e `limit` (default: 24 por página) |
| Retornar `total` no response | Para calcular total de páginas |
| UI: paginação na parte inferior | Botões de página + "Próxima" / "Anterior" |
| Skeleton loading | Placeholder durante carregamento |
| Infinit scroll (futuro) | Para mobile, considerar Intersection Observer |

**Arquivos afetados:**
- Editar: `src/app/api/listings/route.ts` (adicionar paginação)
- Editar: `src/lib/listings-query.ts` (adicionar offset/limit)
- Editar: `src/app/anuncios/page.tsx` (UI de paginação)
- Novo: `src/components/listing/Pagination.tsx`

---

### Fase 3 — Chat em Tempo Real ⭐ Prioridade Alta
**Problema:** Polling a cada 4 segundos é ineficiente e oferece UX ruim.

**Solução:** Usar Supabase Realtime para mensagens.

| Item | Detalhe |
|------|---------|
| Habilitar Realtime na tabela `messages` | Via Supabase Dashboard > Database > Replication |
| Criar canal `chat:{listingId}:{userId}` | Subscription no client |
| Componente `useRealtimeChat` hook | Gerencia subscription, ConnectionState, cleanup |
| Indicador de "digitando" | Campo `typing` na tabela ou pub/sub separado |
| Status online | Heartbeat a cada 30s, armazenar `last_seen` no `users` |
| Marcar como lido | Endpoint `PATCH /api/messages/read` + coluna `read_at` |
| Badge de não lidos | Query `COUNT(*) WHERE recipient_id = ? AND read_at IS NULL` |
| Header do chat: "Online agora" | Baseado em `last_seen` < 2 minutos |

**Migração necessária:**
```sql
ALTER TABLE messages ADD COLUMN read_at timestamptz;
ALTER TABLE users ADD COLUMN last_seen_at timestamptz;
```

**Arquivos afetados:**
- Novo: `src/hooks/useRealtimeChat.ts`
- Editar: `src/app/chat/[listingId]/[userId]/page.tsx` (usar hook)
- Novo: `src/app/api/messages/read/route.ts`
- Editar: `src/components/layout/AppShell.tsx` (badge de não lidos)
- Novo: `src/components/UnreadBadge.tsx`

---

### Fase 4 — Avaliação e Reputação ⭐ Prioridade Média
**Problema:** Sem prevenção de duplicatas, sem campo de comentário, sem perfil público.

**Solução:** Melhorar sistema de ratings.

| Item | Detalhe |
|------|---------|
| Constraint único | `UNIQUE(author_id, target_id, listing_id)` na tabela `ratings` |
| Campo de comentário | Adicionar textarea no widget de avaliação do chat |
| Página de perfil pública | `/usuario/[id]` — mostra listings, avaliação média, comentários |
| API `GET /api/ratings?targetId=X` | Endpoint reutilizável para buscar ratings de um usuário |
| Verificação de transação | Só permitir avaliar se houve mensagens entre os dois |
| Notificação ao avaliado | (Futuro) email ou push quando receber nova avaliação |

**Migração necessária:**
```sql
ALTER TABLE ratings ADD CONSTRAINT unique_rating 
  UNIQUE(author_id, target_id, listing_id);
```

**Arquivos afetados:**
- Novo: `src/app/usuario/[id]/page.tsx` (perfil público)
- Editar: `src/app/chat/[listingId]/[userId]/page.tsx` (textarea de comentário)
- Novo: `src/app/api/ratings/route.ts` (adicionar GET)
- Editar: `src/lib/supabase-types.ts` (atualizar types)

---

### Fase 5 — Fluxo de Conclusão de Venda ⭐ Prioridade Média
**Problema:** Não há fluxo estruturado para marcar um anúncio como vendido/trocado/doado.

**Solução:** Botão de ação + fluxo de confirmação.

| Item | Detalhe |
|------|---------|
| Botão "Marcar como concluído" | No detalhe do anúncio e no chat |
| Modal de confirmação | "Tem certeza? Esta ação não pode ser desfeita." |
| Status transitions | `ativo → reservado → concluido` (com validação) |
| Solicitar avaliação | Após concluir, sugerir avaliar o outro usuário |
| Feedback pós-venda | "Obrigado por usar o Reeduca!" com link para avaliar |

**Arquivos afetados:**
- Novo: `src/components/listing/MarkAsSoldButton.tsx`
- Editar: `src/app/anuncio/[id]/page.tsx` (adicionar botão)
- Editar: `src/app/chat/[listingId]/[userId]/page.tsx` (ação no chat)
- Editar: `src/app/api/listings/[id]/route.ts` (validar transições de status)

---

### Fase 6 — Favoritos e Descoberta ⭐ Prioridade Baixa
**Problema:** Sem contagem de favoritos, sem ordenação por popularidade.

**Solução:**

| Item | Detalhe |
|------|---------|
| Contagem de favoritos | Query `COUNT(*)` ou coluna denormalizada `fav_count` |
| Ordenação "Mais favoritados" | Nova opção no seletor de ordenação |
| Página de favoritos melhorada | Filtros e ordenação |
| "Anúncios similares" | Na página de detalhe, buscar mesma categoria |

**Arquivos afetados:**
- Editar: `src/app/anuncios/page.tsx` (nova ordenação)
- Editar: `src/components/ListingCard.tsx` (mostrar contagem)
- Editar: `src/app/favoritos/page.tsx` (filtros)
- Novo: `src/components/listing/SimilarListings.tsx`

---

### Fase 7 — Segurança e Moderação ⭐ Prioridade Alta (contínua)
**Problema:** Sem rate limiting, sem moderação, RLS permissivo.

**Solução:**

| Item | Detalhe |
|------|---------|
| Rate limiting | Usar `@upstash/ratelimit` com Redis (ou Supabase Edge Functions) |
| Upload: validar tipo e tamanho | Apenas JPG/PNG/WebP, max 5MB por arquivo |
| Denúncia: painel admin | Página `/admin/denuncias` (futuro) |
| Filtro de conteúdo | Usar API de moderação de imagem (Cloudinary ou similar) |
| Soft delete | `deleted_at` em vez de DELETE físico |

**Arquivos afetados:**
- Novo: `src/lib/rate-limit.ts`
- Editar: todas as API routes (adicionar rate limit)
- Novo: `src/app/admin/denuncias/page.tsx` (futuro)

---

### Fase 8 — SEO e Compartilhamento ⭐ Prioridade Baixa
**Solução:**

| Item | Detalhe |
|------|---------|
| JSON-LD | Structured data `Product` para cada anúncio |
| Meta tags | Open Graph + Twitter Cards dinâmicas |
| Sitemap | Gerar `sitemap.xml` com todos os anúncios ativos |
| Compartilhar | Botão "Compartilhar" com Web Share API + fallback |
| robots.txt | Criar na raiz do projeto |

**Arquivos afetados:**
- Editar: `src/app/anuncio/[id]/page.tsx` (JSON-LD + meta tags)
- Novo: `src/app/sitemap.ts` (Next.js sitemap)
- Novo: `src/app/robots.ts`
- Editar: `src/components/listing/ListingActions.tsx` (botão compartilhar melhorado)

---

## 3. Resumo de Migrações do Banco

```sql
-- Fase 1: Storage (via Dashboard, não SQL)
-- Fase 2: Nenhuma
-- Fase 3:
ALTER TABLE messages ADD COLUMN read_at timestamptz;
ALTER TABLE users ADD COLUMN last_seen_at timestamptz;

-- Fase 4:
ALTER TABLE ratings ADD CONSTRAINT unique_rating 
  UNIQUE(author_id, target_id, listing_id);

-- Fase 5: Nenhuma (usa coluna status existente)
-- Fase 6:
ALTER TABLE listings ADD COLUMN fav_count int DEFAULT 0;

-- Fase 7:
ALTER TABLE listings ADD COLUMN deleted_at timestamptz;
```

---

## 4. Ordem Sugerida de Implementação

| # | Fase | Esforço | Impacto | Dependências |
|---|------|---------|---------|--------------|
| 1 | Upload de Fotos | Médio | Alto | Supabase Storage |
| 2 | Paginação | Baixo | Alto | Nenhuma |
| 3 | Chat Tempo Real | Alto | Alto | Supabase Realtime |
| 4 | Avaliação Melhorada | Baixo | Médio | Nenhuma |
| 5 | Conclusão de Venda | Baixo | Médio | Fase 4 |
| 6 | Favoritos/Descoberta | Baixo | Baixo | Nenhuma |
| 7 | Segurança/Moderação | Médio | Alto | Contínuo |
| 8 | SEO | Baixo | Baixo | Nenhuma |

**Recomendação:** Começar por Fase 1 (fotos) + Fase 2 (paginação) em paralelo, depois Fase 3 (chat real-time).

---

## 5. Decisões do Usuário

1. **Upload de fotos:** Supabase Storage ✅
2. **Chat real-time:** Supabase Realtime ✅
3. **Notificações:** Resend — futuro (não agora)
4. **Admin:** Necessário — futuro (não agora)
5. **Moderação:** Manual (denúncias) ✅
6. **Dark mode:** Não implementar
