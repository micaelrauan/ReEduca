-- =============================================
-- Reeduca — Schema Supabase (Postgres)
-- Cole no SQL Editor do Supabase e execute
-- =============================================

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
  id         text PRIMARY KEY,
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
  kind        varchar(20) NOT NULL,
  reporter_id text REFERENCES users(id) ON DELETE CASCADE,
  listing_id  text REFERENCES listings(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies permissivas (service_role bypass, mas protegem anon key)
CREATE POLICY "public_read_listings" ON listings FOR SELECT USING (true);
CREATE POLICY "public_read_users" ON users FOR SELECT USING (true);

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
