-- Tabela para rastrear conversas escondidas pelo usuário
-- Soft delete: o usuário esconde a conversa da lista, mas as mensagens permanecem no banco
CREATE TABLE IF NOT EXISTS chat_hidden (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    other_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id, other_user_id)
);

-- RLS: cada usuário só vê seus próprios registros
ALTER TABLE chat_hidden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own hidden chats"
    ON chat_hidden
    FOR ALL
    USING (auth.uid() = user_id);

-- Índice para queries de threads
CREATE INDEX IF NOT EXISTS idx_chat_hidden_user ON chat_hidden(user_id);
