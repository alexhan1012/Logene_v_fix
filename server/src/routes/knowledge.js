const express = require('express');
const fs = require('fs');
const router = express.Router();
const upload = require('../middleware/upload');
const knowledgeService = require('../services/knowledge');

// Create a knowledge entry
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, error_description, solution } = req.body;

    if (!error_description || !solution) {
      return res.status(400).json({
        success: false,
        error: 'error_description and solution are required',
      });
    }

    let tags = req.body.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    let imageBase64 = null;
    let error_image_path = null;
    if (req.file) {
      error_image_path = `/uploads/${req.file.filename}`;
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    }

    const entry = await knowledgeService.create({
      title,
      error_image_path,
      error_description,
      solution,
      tags,
      imageBase64,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('Create knowledge entry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// List knowledge entries (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));

    const result = await knowledgeService.findAll(page, pageSize);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('List knowledge entries error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single knowledge entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await knowledgeService.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (err) {
    console.error('Get knowledge entry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a knowledge entry
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = {};

    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.error_description !== undefined)
      updateData.error_description = req.body.error_description;
    if (req.body.solution !== undefined) updateData.solution = req.body.solution;

    if (req.body.tags !== undefined) {
      let tags = req.body.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }
      updateData.tags = tags;
    }

    if (req.file) {
      updateData.error_image_path = `/uploads/${req.file.filename}`;
      updateData.imageBase64 = fs.readFileSync(req.file.path, {
        encoding: 'base64',
      });
    }

    const entry = await knowledgeService.update(req.params.id, updateData);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    res.json({ success: true, data: entry });
  } catch (err) {
    console.error('Update knowledge entry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a knowledge entry
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await knowledgeService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    res.json({ success: true, data: { message: 'Entry deleted' } });
  } catch (err) {
    console.error('Delete knowledge entry error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
