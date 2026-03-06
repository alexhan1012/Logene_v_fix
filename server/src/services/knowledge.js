const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');
const volcEngine = require('./volcEngine');
const config = require('../config');

class KnowledgeService {
  /**
   * Build a combined text blob for embedding from the entry fields.
   */
  _buildEmbeddingText(entry) {
    const parts = [
      entry.title || '',
      entry.error_description || '',
      entry.solution || '',
      entry.vlm_analysis || '',
    ];
    if (entry.tags && entry.tags.length) {
      parts.push(entry.tags.join(' '));
    }
    return parts.filter(Boolean).join('\n');
  }

  /**
   * Create a new knowledge entry.
   */
  async create(data) {
    const {
      title,
      error_image_path,
      error_description,
      solution,
      tags,
      imageBase64,
    } = data;

    // VLM analysis (optional – only when image or description present)
    let vlmText = null;
    let vlmJson = null;
    if (imageBase64 || error_description) {
      try {
        const analysis = await volcEngine.analyzeImage(
          imageBase64 || null,
          error_description
        );
        vlmText = analysis.text;
        vlmJson = analysis.json;
      } catch (err) {
        console.warn('VLM analysis failed, continuing without it:', err.message);
      }
    }

    // Generate embedding
    let embedding = null;
    const embeddingText = this._buildEmbeddingText({
      title,
      error_description,
      solution,
      vlm_analysis: vlmText,
      tags,
    });

    if (embeddingText.trim()) {
      try {
        embedding = await volcEngine.generateEmbedding(embeddingText);
      } catch (err) {
        console.warn('Embedding generation failed, continuing without it:', err.message);
      }
    }

    const embeddingLiteral = embedding
      ? `[${embedding.join(',')}]`
      : null;

    const { rows } = await pool.query(
      `INSERT INTO knowledge_entries
        (title, error_image_path, error_description, solution,
         vlm_analysis, vlm_analysis_json, embedding, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)
       RETURNING *`,
      [
        title || null,
        error_image_path || null,
        error_description,
        solution,
        vlmText,
        vlmJson ? JSON.stringify(vlmJson) : null,
        embeddingLiteral,
        tags || null,
      ]
    );

    return rows[0];
  }

  /**
   * Find a single entry by id.
   */
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM knowledge_entries WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * List entries with pagination.
   */
  async findAll(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, title, error_image_path, error_description, solution,
                vlm_analysis, vlm_analysis_json, tags, created_at, updated_at
         FROM knowledge_entries
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      ),
      pool.query('SELECT COUNT(*) AS total FROM knowledge_entries'),
    ]);

    return {
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      pageSize,
    };
  }

  /**
   * Update an existing entry. Re-analyze if image or description changed.
   */
  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title : existing.title;
    const error_description =
      data.error_description !== undefined
        ? data.error_description
        : existing.error_description;
    const solution =
      data.solution !== undefined ? data.solution : existing.solution;
    const tags = data.tags !== undefined ? data.tags : existing.tags;
    const error_image_path =
      data.error_image_path !== undefined
        ? data.error_image_path
        : existing.error_image_path;

    const descriptionChanged = data.error_description !== undefined
      && data.error_description !== existing.error_description;
    const imageChanged = data.imageBase64 || data.error_image_path !== undefined;

    let vlmText = existing.vlm_analysis;
    let vlmJson = existing.vlm_analysis_json;

    if (descriptionChanged || imageChanged) {
      try {
        const analysis = await volcEngine.analyzeImage(
          data.imageBase64 || null,
          error_description
        );
        vlmText = analysis.text;
        vlmJson = analysis.json;
      } catch (err) {
        console.warn('VLM re-analysis failed:', err.message);
      }
    }

    // Regenerate embedding
    let embedding = null;
    const embeddingText = this._buildEmbeddingText({
      title,
      error_description,
      solution,
      vlm_analysis: vlmText,
      tags,
    });
    if (embeddingText.trim()) {
      try {
        embedding = await volcEngine.generateEmbedding(embeddingText);
      } catch (err) {
        console.warn('Embedding regeneration failed:', err.message);
      }
    }

    const embeddingLiteral = embedding
      ? `[${embedding.join(',')}]`
      : null;

    const { rows } = await pool.query(
      `UPDATE knowledge_entries
       SET title = $1,
           error_image_path = $2,
           error_description = $3,
           solution = $4,
           vlm_analysis = $5,
           vlm_analysis_json = $6,
           embedding = $7::vector,
           tags = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        title,
        error_image_path,
        error_description,
        solution,
        vlmText,
        vlmJson ? JSON.stringify(vlmJson) : null,
        embeddingLiteral,
        tags,
        id,
      ]
    );

    // Clean up old image if it was replaced
    if (
      data.error_image_path &&
      existing.error_image_path &&
      data.error_image_path !== existing.error_image_path
    ) {
      const oldPath = path.join(config.upload.dir, path.basename(existing.error_image_path));
      fs.unlink(oldPath, (err) => {
        if (err) console.warn('Failed to delete old image:', err.message);
      });
    }

    return rows[0];
  }

  /**
   * Delete an entry and its associated image file.
   */
  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;

    await pool.query('DELETE FROM knowledge_entries WHERE id = $1', [id]);

    if (existing.error_image_path) {
      const filePath = path.join(
        config.upload.dir,
        path.basename(existing.error_image_path)
      );
      fs.unlink(filePath, (err) => {
        if (err) console.warn('Failed to delete image file:', err.message);
      });
    }

    return true;
  }

  /**
   * Semantic vector search: optionally analyze image, generate embedding, and
   * find the closest entries via cosine similarity.
   */
  async search(imageBase64, textDescription, limit = 10) {
    let queryText = textDescription || '';

    // Run VLM analysis on the query if an image is provided
    if (imageBase64) {
      try {
        const analysis = await volcEngine.analyzeImage(imageBase64, textDescription);
        if (analysis.json) {
          queryText = [
            queryText,
            analysis.json.phenomenon || '',
            analysis.json.summary || '',
            (analysis.json.keywords || []).join(' '),
          ]
            .filter(Boolean)
            .join('\n');
        } else {
          queryText = [queryText, analysis.text].filter(Boolean).join('\n');
        }
      } catch (err) {
        console.warn('VLM analysis for search failed:', err.message);
      }
    }

    if (!queryText.trim()) {
      return [];
    }

    // Generate embedding for the query
    const embedding = await volcEngine.generateEmbedding(queryText);
    const embeddingLiteral = `[${embedding.join(',')}]`;

    const { rows } = await pool.query(
      `SELECT id, title, error_image_path, error_description, solution,
              vlm_analysis, vlm_analysis_json, tags, created_at, updated_at,
              1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_entries
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [embeddingLiteral, limit]
    );

    return rows;
  }
}

module.exports = new KnowledgeService();
