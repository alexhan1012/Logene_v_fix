const express = require('express');
const fs = require('fs');
const router = express.Router();
const upload = require('../middleware/upload');
const knowledgeService = require('../services/knowledge');

// Semantic search with optional image and text
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { text_description } = req.body;
    const limit = Math.min(50, Math.max(1, parseInt(req.body.limit, 10) || 10));

    let imageBase64 = null;
    if (req.file) {
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    }

    if (!imageBase64 && !text_description) {
      return res.status(400).json({
        success: false,
        error: 'At least one of image or text_description is required',
      });
    }

    const results = await knowledgeService.search(
      imageBase64,
      text_description,
      limit
    );

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
