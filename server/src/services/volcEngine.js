const axios = require('axios');
const config = require('../config');
const pool = require('../db/pool');

class VolcEngineService {
  constructor() {
    this.apiKey = config.volcEngine.apiKey;
    this.baseUrl = config.volcEngine.baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      timeout: 120000,
    });
  }

  /**
   * Resolve which model endpoint to use. If modelId is provided use it,
   * otherwise look up the persisted setting, falling back to the default.
   */
  async _resolveModel(kind, modelId) {
    if (modelId) return modelId;
    try {
      const { rows } = await pool.query(
        "SELECT value FROM app_settings WHERE key = 'models'"
      );
      if (rows.length > 0 && rows[0].value[kind]) {
        return rows[0].value[kind];
      }
    } catch {
      // fall through
    }
    return config.defaultModels[kind];
  }

  /**
   * Analyze an error screenshot with VLM and return structured JSON.
   */
  async analyzeImage(imageBase64, textDescription, modelId) {
    const model = await this._resolveModel('vlm', modelId);

    const prompt = `你是一个专业的IT故障分析专家。请分析以下报错截图和描述，生成结构化的故障分析。

文字描述: ${textDescription || '无'}

请以JSON格式输出以下信息:
{
  "phenomenon": "故障现象的详细描述",
  "error_codes": ["提取到的错误码列表"],
  "system_info": "涉及的系统/软件信息",
  "severity": "严重程度: 高/中/低",
  "keywords": ["关键词列表，用于后续检索"],
  "summary": "一句话总结该故障"
}

只输出JSON，不要输出其他内容。`;

    const content = [];
    if (imageBase64) {
      const dataUrl = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`;
      content.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    }
    content.push({ type: 'text', text: prompt });

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages: [{ role: 'user', content }],
        temperature: 0.2,
      });

      const text = response.data.choices[0].message.content;
      let parsed = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // keep raw text
      }

      return { text, json: parsed };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || err.message || 'VLM analysis failed';
      throw new Error(`VLM analysis error: ${msg}`);
    }
  }

  /**
   * Generate an embedding vector for the given text.
   */
  async generateEmbedding(text, modelId) {
    const model = await this._resolveModel('embedding', modelId);

    try {
      const response = await this.client.post('/embeddings', {
        model,
        input: [text],
        encoding_format: 'float',
      });

      return response.data.data[0].embedding;
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || err.message || 'Embedding generation failed';
      throw new Error(`Embedding error: ${msg}`);
    }
  }

  /**
   * Generic chat completion.
   */
  async chat(messages, modelId) {
    const model = await this._resolveModel('text', modelId);

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
      });

      return response.data.choices[0].message.content;
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || err.message || 'Chat completion failed';
      throw new Error(`Chat error: ${msg}`);
    }
  }

  /**
   * Return available model options.
   */
  getAvailableModels() {
    return [
      { id: 'doubao-1-5-vision-pro-32k', name: 'Doubao 1.5 Vision Pro 32K', type: 'vlm' },
      { id: 'doubao-1-5-pro-32k', name: 'Doubao 1.5 Pro 32K', type: 'text' },
      { id: 'doubao-1-5-pro-256k', name: 'Doubao 1.5 Pro 256K', type: 'text' },
      { id: 'doubao-embedding-large', name: 'Doubao Embedding Large', type: 'embedding' },
      { id: 'doubao-1-5-vision-pro-256k', name: 'Doubao 1.5 Vision Pro 256K', type: 'vlm' },
    ];
  }
}

module.exports = new VolcEngineService();
