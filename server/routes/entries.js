import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, mkdirSync, unlinkSync } from 'fs'
import { getPool, getSettings } from '../services/db.js'
import { analyzeImageWithVLM, analyzeTextWithModel, generateEmbedding } from '../services/volcanoEngine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '../../uploads')
mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const pool = getPool()

    let countQuery = 'SELECT COUNT(*) FROM kb_entries'
    let dataQuery = `SELECT id, title, image_url, description, solution, vlm_analysis, tags, created_at FROM kb_entries`
    const params = []

    if (search) {
      const searchClause = ` WHERE title ILIKE $1 OR description ILIKE $1 OR solution ILIKE $1`
      countQuery += searchClause
      dataQuery += searchClause
      params.push(`%${search}%`)
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, parseInt(pageSize), offset]),
    ])

    res.json({
      success: true,
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', upload.single('image'), async (req, res) => {
  const { title, description, solution } = req.body
  const imageFile = req.file

  try {
    const settings = await getSettings()
    let vlmAnalysis = null
    let structuredDescription = description

    if (imageFile) {
      const imageBase64 = readFileSync(imageFile.path).toString('base64')
      try {
        vlmAnalysis = await analyzeImageWithVLM(
          imageBase64,
          description,
          settings.vlm_model,
          settings.api_key
        )
        structuredDescription = vlmAnalysis.summary || description
      } catch (e) {
        console.error('VLM analysis failed:', e.message)
        vlmAnalysis = { summary: description, error: e.message }
      }
    } else {
      try {
        vlmAnalysis = await analyzeTextWithModel(description, settings.text_model, settings.api_key)
        structuredDescription = vlmAnalysis.summary || description
      } catch (e) {
        console.error('Text analysis failed:', e.message)
      }
    }

    const embeddingText = `${title} ${structuredDescription} ${solution}`
    let embedding = null
    try {
      embedding = await generateEmbedding(embeddingText, settings.embedding_model, settings.api_key)
    } catch (e) {
      console.error('Embedding generation failed:', e.message)
    }

    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : null

    const pool = getPool()
    const result = await pool.query(
      `INSERT INTO kb_entries (title, image_path, image_url, description, solution, vlm_analysis, structured_description, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        imageFile ? imageFile.path : null,
        imageUrl,
        description,
        solution,
        vlmAnalysis ? JSON.stringify(vlmAnalysis) : null,
        structuredDescription,
        embedding ? `[${embedding.join(',')}]` : null,
      ]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (imageFile) {
      try { unlinkSync(imageFile.path) } catch (cleanupErr) {
        console.error('Failed to clean up temp file:', cleanupErr.message)
      }
    }
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM kb_entries WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool()
    const entry = await pool.query('SELECT image_path FROM kb_entries WHERE id = $1', [req.params.id])
    if (entry.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entry not found' })
    }
    if (entry.rows[0].image_path) {
      try { unlinkSync(entry.rows[0].image_path) } catch (cleanupErr) {
        console.error('Failed to clean up image file:', cleanupErr.message)
      }
    }
    await pool.query('DELETE FROM kb_entries WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
