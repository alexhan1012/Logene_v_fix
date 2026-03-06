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

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 20 * 1024 * 1024 },
})

const router = Router()

router.post('/', upload.single('image'), async (req, res) => {
  const { query = '' } = req.body
  const imageFile = req.file

  try {
    const settings = await getSettings()
    const searchLimit = parseInt(settings.search_limit || '5')
    const similarityThreshold = parseFloat(settings.similarity_threshold || '0.5')

    let analysis = null
    let searchText = query

    if (imageFile) {
      const imageBase64 = readFileSync(imageFile.path).toString('base64')
      try {
        analysis = await analyzeImageWithVLM(
          imageBase64,
          query,
          settings.vlm_model,
          settings.api_key
        )
        searchText = analysis.summary || query
      } catch (e) {
        console.error('VLM analysis failed:', e.message)
        searchText = query
      } finally {
        try { unlinkSync(imageFile.path) } catch (cleanupErr) {
          console.error('Failed to clean up temp file:', cleanupErr.message)
        }
      }
    } else if (query) {
      try {
        analysis = await analyzeTextWithModel(query, settings.text_model, settings.api_key)
        searchText = analysis.summary || query
      } catch (e) {
        console.error('Text analysis failed:', e.message)
      }
    }

    if (!searchText) {
      return res.json({ success: true, data: [], analysis })
    }

    let embedding = null
    try {
      embedding = await generateEmbedding(searchText, settings.embedding_model, settings.api_key)
    } catch (e) {
      console.error('Embedding failed:', e.message)
      return res.json({ success: true, data: [], analysis, error: 'Embedding generation failed' })
    }

    const pool = getPool()
    const vectorStr = `[${embedding.join(',')}]`
    const result = await pool.query(
      `SELECT id, title, image_url, description, solution, vlm_analysis, tags, created_at,
              1 - (embedding <=> $1::vector) AS similarity
       FROM kb_entries
       WHERE embedding IS NOT NULL
         AND 1 - (embedding <=> $1::vector) >= $2
       ORDER BY similarity DESC
       LIMIT $3`,
      [vectorStr, similarityThreshold, searchLimit]
    )

    res.json({ success: true, data: result.rows, analysis })
  } catch (err) {
    if (imageFile) {
      try { unlinkSync(imageFile.path) } catch (cleanupErr) {
        console.error('Failed to clean up temp file:', cleanupErr.message)
      }
    }
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
