const pool = require('./pool');
const config = require('../config');

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('pgvector extension enabled');

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500),
        error_image_path TEXT,
        error_description TEXT NOT NULL,
        solution TEXT NOT NULL,
        vlm_analysis TEXT,
        vlm_analysis_json JSONB,
        embedding vector(${config.vector.dimensions}),
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('knowledge_entries table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('app_settings table ready');

    // Attempt to create IVFFlat index; requires sufficient rows. Fall back to HNSW.
    try {
      const { rows } = await client.query(
        'SELECT COUNT(*) AS cnt FROM knowledge_entries'
      );
      const count = parseInt(rows[0].cnt, 10);
      if (count >= 100) {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
          ON knowledge_entries USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `);
        console.log('IVFFlat index created');
      } else {
        // Use HNSW index which does not require a minimum row count
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_knowledge_embedding_hnsw
          ON knowledge_entries USING hnsw (embedding vector_cosine_ops)
        `);
        console.log('HNSW index created (insufficient rows for IVFFlat)');
      }
    } catch (indexErr) {
      console.warn('Index creation skipped:', indexErr.message);
    }

    // Seed default model settings if not present
    await client.query(`
      INSERT INTO app_settings (key, value)
      VALUES ('models', $1::jsonb)
      ON CONFLICT (key) DO NOTHING
    `, [JSON.stringify(config.defaultModels)]);

    console.log('Database initialization complete');
  } finally {
    client.release();
  }
}

module.exports = initDatabase;
