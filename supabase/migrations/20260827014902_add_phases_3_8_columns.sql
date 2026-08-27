-- Fase 3: Chat Real-time
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Fase 6: Favoritos (contagem denormalizada)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS fav_count int DEFAULT 0;

-- Fase 7: Moderação (soft delete)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Fase 4: Avaliação Melhorada — remover duplicatas antes do constraint
DELETE FROM ratings
WHERE id NOT IN (
  SELECT MIN(id)
  FROM ratings
  GROUP BY author_id, target_id, listing_id
);

ALTER TABLE ratings ADD CONSTRAINT unique_rating UNIQUE (author_id, target_id, listing_id);

-- Habilitar Realtime na tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
