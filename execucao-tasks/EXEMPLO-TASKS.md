# Exemplo de Tasks — Redeca

> Este arquivo mostra como ficaria um conjunto real de tasks para o projeto.
> Copie os blocos abaixo para `TASKS.md` quando for usar.

---

## Task-001 — Criar rota /criar-anuncio

**Depends:** []
**Priority:** high
**Status:** pending

### Objetivo
Criar a página `/criar-anuncio` com formulário completo para criação de anúncios.

### Critérios de Aceite
- [ ] Rota `/criar-anuncio` existe e renderiza sem erros de build
- [ ] Formulário tem campos: título, descrição, preço, categoria, condição, imagens
- [ ] Validação com zod em todos os campos obrigatórios
- [ ] Mensagens de erro aparecem em português
- [ ] Server Action cria registro na tabela `listings` via Supabase
- [ ] Redireciona para `/anuncios/[id]` após sucesso

### Plano de Execução
1. Criar `src/app/criar-anuncio/page.tsx` (Server Component)
2. Criar componente `src/components/criar-anuncio-form.tsx` ("use client")
3. Definir schema zod em `src/lib/schemas/criar-anuncio.ts`
4. Criar Server Action em `src/app/criar-anuncio/actions.ts`
5. Integrar com Supabase (insert na tabela listings)

### Validação
```bash
npx tsc --noEmit
npx eslint src/app/criar-anuncio/ src/components/criar-anuncio-form.tsx src/lib/schemas/criar-anuncio.ts src/app/criar-anuncio/actions.ts
npm run build
```

### Auto-Fix
> Se typecheck falhar → corrigir tipos. Se lint falhar → seguir sugestões do eslint.
> Max retries: 2. Se build falhar after 2 retries → marcar failed.

---

## Task-002 — Criar listagem de anúncios

**Depends:** [Task-001]
**Priority:** high
**Status:** pending

### Objetivo
Página `/anuncios` que lista todos os anúncios do usuário logado com filtros.

### Critérios de Aceite
- [ ] Rota `/anuncios` existe e renderiza
- [ ] Lista anúncios do usuário autenticado (via Clerk user ID)
- [ ] Filtros por categoria, condição e status
- [ ] Loading state enquanto busca dados
- [ ] Empty state quando não há anúncios
- [ ] Card de anúncio mostra: imagem, título, preço, status

### Plano de Execução
1. Criar `src/app/anuncios/page.tsx`
2. Criar componente `src/components/anuncio-card.tsx`
3. Criar Server Action para buscar listings do usuário
4. Adicionar filtros com search params
5. Implementar loading e empty states

### Validação
```bash
npx tsc --noEmit
npm run lint
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-003 — Criar página de detalhes do anúncio

**Depends:** [Task-002]
**Priority:** high
**Status:** pending

### Objetivo
Página `/anuncios/[id]` com todos os detalhes do anúncio e opções de editar/excluir.

### Critérios de Aceite
- [ ] Rota dinâmica funciona para qualquer ID válido
- [ ] Mostra todas as informações do anúncio
- [ ] Botões de editar e excluir (só para o dono)
- [ ] Exclusão com confirmação e delete cascade
- [ ] 404 customizado para ID inexistente

### Plano de Execução
1. Criar `src/app/anuncios/[id]/page.tsx`
2. Criar componente de detalhes
3. Server Action para buscar anúncio por ID
4. Server Action para excluir anúncio
5. Componente de confirmação de exclusão

### Validação
```bash
npx tsc --noEmit
npm run lint
npm run build
```

### Auto-Fix
> Max retries: 2

---

## Task-004 — Criar sistema de busca

**Depends:** [Task-002]
**Priority:** medium
**Status:** pending

### Objetivo
Adicionar busca full-text nos anúncios com Supabase full-text search.

### Critérios de Aceite
- [ ] Campo de busca na página /anuncios
- [ ] Busca por título e descrição (full-text)
- [ ] Debounce de 300ms na busca
- [ ] Resultados atualizam sem reload da página
- [ ] Busca vazia mostra mensagem amigável

### Plano de Execução
1. Adicionar tsvector na tabela listings (migration SQL)
2. Criar Server Action de busca
3. Componente de busca com debounce
4. Integrar com filtros existentes

### Validação
```bash
npx tsc --noEmit
npm run lint
```

### Auto-Fix
> Max retries: 2
