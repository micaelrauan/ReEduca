-- Migration: Adicionar schema admin
-- Data: 2026-09-04
-- Descrição: roles, admin_actions, banned_at, featured, reports status

-- 1. Enum para roles de usuário
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 2. Enum para status de denúncias
CREATE TYPE report_status AS ENUM ('pendente', 'revisado', 'dispensado', 'aceito');

-- 3. Colunas de admin na tabela users
ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';
ALTER TABLE users ADD COLUMN banned_at timestamptz;
ALTER TABLE users ADD COLUMN ban_reason varchar(500);

-- 4. Colunas de moderação na tabela reports
ALTER TABLE reports ADD COLUMN status report_status DEFAULT 'pendente';
ALTER TABLE reports ADD COLUMN reviewed_by text REFERENCES users(id);
ALTER TABLE reports ADD COLUMN reviewed_at timestamptz;
ALTER TABLE reports ADD COLUMN note varchar(1000);

-- 5. Coluna de destaque na tabela listings
ALTER TABLE listings ADD COLUMN featured boolean DEFAULT false;

-- 6. Tabela de log de ações admin
CREATE TABLE admin_actions (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_id   text NOT NULL REFERENCES users(id),
  action     varchar(100) NOT NULL,     -- 'ban_user', 'unban_user', 'promote_user', 'demote_user', 'hide_listing', 'feature_listing', etc.
  target_type varchar(50) NOT NULL,     -- 'user', 'listing', 'report', 'message'
  target_id  text NOT NULL,
  note       varchar(1000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);

-- 7. RLS para admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_admin_actions" ON admin_actions FOR ALL USING (true);

-- 8. Indexes úteis
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_banned ON users(banned_at) WHERE banned_at IS NOT NULL;
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_listings_featured ON listings(featured) WHERE featured = true;

-- 9. Promover primeiro admin (substitua pelo seu userId do Clerk)
-- EXEMPLO: UPDATE users SET role = 'admin' WHERE id = 'user_XXXXXXXXXXXXXXXXX';
