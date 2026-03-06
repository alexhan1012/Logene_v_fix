import OpenAI from 'openai'

const VOLCANO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
const DEFAULT_API_KEY = '20efb8c0-01f7-4d1d-a6d2-9fe6adc84d3c'

function getClient(apiKey = DEFAULT_API_KEY) {
  return new OpenAI({
    apiKey: apiKey || DEFAULT_API_KEY,
    baseURL: VOLCANO_BASE_URL,
  })
}

async function analyzeImageWithVLM(imageBase64, textDescription, model = 'doubao-1-5-vision-pro-32k', apiKey = DEFAULT_API_KEY) {
  const client = getClient(apiKey)
  const prompt = `请分析这张报错截图，并结合以下文字描述："${textDescription}"

请以JSON格式返回分析结果，包含以下字段：
{
  "phenomenon": "描述看到的现象，如界面异常、报错信息等",
  "error_codes": "提取所有可见的错误码、错误消息",
  "system_state": "描述系统状态，如哪个功能模块、操作步骤",
  "affected_components": "受影响的组件或功能",
  "summary": "一段综合性的问题描述，用于向量搜索"
}
只返回JSON，不要其他内容。`

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    },
  ]

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: 1024,
  })

  const content = response.choices[0].message.content
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch (e) {
    console.warn('VLM response was not valid JSON, using raw content as summary:', e.message)
    return {
      phenomenon: content,
      error_codes: '',
      system_state: '',
      affected_components: '',
      summary: content,
    }
  }
}

async function analyzeTextWithModel(textDescription, model = 'doubao-1-5-pro-32k', apiKey = DEFAULT_API_KEY) {
  const client = getClient(apiKey)
  const prompt = `请分析以下IT问题描述，并以JSON格式返回结构化信息：
"${textDescription}"

请返回：
{
  "phenomenon": "描述问题现象",
  "error_codes": "提取错误码或错误消息（如有）",
  "system_state": "描述系统状态",
  "affected_components": "受影响的组件或功能",
  "summary": "综合性问题描述，用于向量搜索"
}
只返回JSON，不要其他内容。`

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  })

  const content = response.choices[0].message.content
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(content)
  } catch (e) {
    console.warn('Text model response was not valid JSON, using raw content as summary:', e.message)
    return {
      phenomenon: textDescription,
      error_codes: '',
      system_state: '',
      affected_components: '',
      summary: textDescription,
    }
  }
}

async function generateEmbedding(text, model = 'doubao-embedding', apiKey = DEFAULT_API_KEY) {
  const client = getClient(apiKey)
  const response = await client.embeddings.create({
    model,
    input: text,
  })
  return response.data[0].embedding
}

const AVAILABLE_MODELS = {
  vlm: [
    { value: 'doubao-1-5-vision-pro-32k', label: 'Doubao 1.5 Vision Pro 32K (推荐)' },
    { value: 'doubao-1-5-vision-lite-32k', label: 'Doubao 1.5 Vision Lite 32K' },
    { value: 'doubao-vision-pro-32k', label: 'Doubao Vision Pro 32K' },
  ],
  embedding: [
    { value: 'doubao-embedding', label: 'Doubao Embedding (推荐)' },
    { value: 'doubao-embedding-large', label: 'Doubao Embedding Large' },
  ],
  text: [
    { value: 'doubao-1-5-pro-32k', label: 'Doubao 1.5 Pro 32K (推荐)' },
    { value: 'doubao-1-5-lite-32k', label: 'Doubao 1.5 Lite 32K' },
    { value: 'doubao-pro-32k', label: 'Doubao Pro 32K' },
  ],
}

export { getClient, analyzeImageWithVLM, analyzeTextWithModel, generateEmbedding, AVAILABLE_MODELS }
