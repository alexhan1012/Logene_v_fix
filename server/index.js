import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { rateLimit } from 'express-rate-limit'
import entriesRouter from './routes/entries.js'
import searchRouter from './routes/search.js'
import settingsRouter from './routes/settings.js'
import { initializeDB } from './services/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const UPLOADS_DIR = path.join(__dirname, '../uploads')
mkdirSync(UPLOADS_DIR, { recursive: true })

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

async function startServer() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))
  app.use('/uploads', express.static(UPLOADS_DIR))

  app.use('/api', apiLimiter)
  app.use('/api/entries', entriesRouter)
  app.use('/api/search', searchRouter)
  app.use('/api/settings', settingsRouter)

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

  try {
    await initializeDB()
  } catch (err) {
    console.error('Failed to initialize DB:', err.message)
  }

  return new Promise((resolve) => {
    const server = app.listen(3001, () => {
      console.log('Express server running on port 3001')
      resolve(server)
    })
  })
}

export { startServer }
