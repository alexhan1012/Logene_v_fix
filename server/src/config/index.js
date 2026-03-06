module.exports = {
  port: process.env.PORT || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'knowledge_base',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  volcEngine: {
    apiKey: process.env.VOLC_API_KEY || '',
    baseUrl: process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  },
  defaultModels: {
    vlm: process.env.VLM_MODEL || 'doubao-1-5-vision-pro-32k',
    embedding: process.env.EMBEDDING_MODEL || 'doubao-embedding-large',
    text: process.env.TEXT_MODEL || 'doubao-1-5-pro-32k',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: 10 * 1024 * 1024,
  },
  vector: {
    dimensions: 1024,
  },
};
