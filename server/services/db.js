import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let pool = null
let cachedSettings = null

const DEFAULT_SETTINGS = {
  db_host: 'localhost',
  db_port: '5432',
  db_name: 'knowledge_base',
  db_user: 'postgres',
  db_password: '',
  api_key: '20efb8c0-01f7-4d1d-a6d2-9fe6adc84d3c',
  vlm_model: 'doubao-1-5-vision-pro-32k',
  embedding_model: 'doubao-embedding',
  text_model: 'doubao-1-5-pro-32k',
  search_limit: '5',
  similarity_threshold: '0.5',
}

function getPool(settings = null) {
  const s = settings || cachedSettings || DEFAULT_SETTINGS
  if (!pool) {
    pool = new Pool({
      host: s.db_host || 'localhost',
      port: parseInt(s.db_port || '5432'),
      database: s.db_name || 'knowledge_base',
      user: s.db_user || 'postgres',
      password: s.db_password || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }
  return pool
}

function resetPool() {
  if (pool) {
    pool.end()
    pool = null
  }
}

async function initializeDB() {
  const schemaPath = path.join(__dirname, '../db/schema.sql')
  const schema = readFileSync(schemaPath, 'utf8')
  const client = await getPool().connect()
  try {
    await client.query(schema)
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('DB init error:', err.message)
  } finally {
    client.release()
  }
}

async function getSettings() {
  try {
    const result = await getPool().query('SELECT key, value FROM app_settings')
    const settings = { ...DEFAULT_SETTINGS }
    for (const row of result.rows) {
      settings[row.key] = row.value
    }
    cachedSettings = settings
    return settings
  } catch (err) {
    console.error('getSettings error:', err.message)
    return DEFAULT_SETTINGS
  }
}

async function updateSettings(updates) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO app_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      )
    }
    await client.query('COMMIT')
    cachedSettings = null
    if (['db_host', 'db_port', 'db_name', 'db_user', 'db_password'].some(k => k in updates)) {
      resetPool()
    }
    return true
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export { getPool, initializeDB, getSettings, updateSettings, resetPool }
