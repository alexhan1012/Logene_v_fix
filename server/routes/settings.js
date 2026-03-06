import { Router } from 'express'
import { getSettings, updateSettings } from '../services/db.js'
import { AVAILABLE_MODELS } from '../services/volcanoEngine.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const settings = await getSettings()
    res.json({ success: true, data: settings })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const updates = req.body
    await updateSettings(updates)
    const settings = await getSettings()
    res.json({ success: true, data: settings })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/models', (req, res) => {
  res.json({ success: true, data: AVAILABLE_MODELS })
})

export default router
