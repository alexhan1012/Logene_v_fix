const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const volcEngine = require('../services/volcEngine');

// Get all settings
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value, updated_at FROM app_settings ORDER BY key'
    );

    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body must be a JSON object of key-value pairs',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(updates)) {
        await client.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (key)
           DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
          [key, JSON.stringify(value)]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, data: { message: 'Settings updated' } });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get available models
router.get('/models', (_req, res) => {
  try {
    const models = volcEngine.getAvailableModels();
    res.json({ success: true, data: models });
  } catch (err) {
    console.error('Get models error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
