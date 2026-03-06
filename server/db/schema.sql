CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kb_entries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  image_path TEXT,
  image_url TEXT,
  description TEXT NOT NULL,
  solution TEXT NOT NULL,
  vlm_analysis JSONB,
  structured_description TEXT,
  embedding vector(2048),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kb_entries_embedding_idx
  ON kb_entries USING hnsw (embedding vector_cosine_ops);

INSERT INTO app_settings (key, value) VALUES
  ('vlm_model', 'doubao-1-5-vision-pro-32k'),
  ('embedding_model', 'doubao-embedding'),
  ('text_model', 'doubao-1-5-pro-32k'),
  ('db_host', 'localhost'),
  ('db_port', '5432'),
  ('db_name', 'knowledge_base'),
  ('db_user', 'postgres'),
  ('db_password', ''),
  ('api_key', '20efb8c0-01f7-4d1d-a6d2-9fe6adc84d3c'),
  ('search_limit', '5'),
  ('similarity_threshold', '0.5')
ON CONFLICT (key) DO NOTHING;
