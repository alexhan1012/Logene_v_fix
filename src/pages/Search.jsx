import React, { useState } from 'react'
import { Input, Button, Card, Typography, Space, Spin, Empty, Alert } from 'antd'
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons'
import ImageUpload from '../components/ImageUpload'
import SearchResult from '../components/SearchResult'

const { TextArea } = Input
const { Title, Text } = Typography

export default function Search({ baseURL }) {
  const [imageFile, setImageFile] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  async function handleSearch() {
    if (!imageFile && !query.trim()) {
      return
    }
    setLoading(true)
    setResults(null)
    setAnalysis(null)
    setError(null)

    try {
      const formData = new FormData()
      if (imageFile) formData.append('image', imageFile)
      if (query.trim()) formData.append('query', query.trim())

      const res = await fetch(`${baseURL}/api/search`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        setResults(data.data)
        setAnalysis(data.analysis)
      } else {
        throw new Error(data.error || '搜索失败')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>搜索知识库</Title>

      <Card style={{ borderRadius: 12, marginBottom: 24, maxWidth: 800 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>上传错误截图（可选）</Text>
            <ImageUpload onChange={setImageFile} value={imageFile} />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>问题描述</Text>
            <TextArea
              rows={3}
              placeholder="描述遇到的问题..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              size="large"
            />
          </div>

          <Button
            type="primary"
            size="large"
            icon={loading ? <LoadingOutlined /> : <SearchOutlined />}
            onClick={handleSearch}
            disabled={!imageFile && !query.trim()}
            loading={loading}
            style={{ width: '100%', height: 48, borderRadius: 8, fontSize: 16 }}
          >
            {loading ? '正在分析并搜索...' : '搜索相似解决方案'}
          </Button>
        </Space>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" tip="正在分析并搜索..." />
        </div>
      )}

      {error && (
        <Alert type="error" message="搜索失败" description={error} showIcon style={{ marginBottom: 16 }} />
      )}

      {results !== null && !loading && (
        <div>
          {analysis && (
            <Card title="AI 分析结果" style={{ borderRadius: 12, marginBottom: 16, background: '#f6f8ff' }}>
              <Space direction="vertical">
                {analysis.phenomenon && <Text><b>现象：</b>{analysis.phenomenon}</Text>}
                {analysis.error_codes && <Text><b>错误码：</b>{analysis.error_codes}</Text>}
                {analysis.system_state && <Text><b>系统状态：</b>{analysis.system_state}</Text>}
                {analysis.affected_components && <Text><b>受影响组件：</b>{analysis.affected_components}</Text>}
              </Space>
            </Card>
          )}

          {results.length === 0 ? (
            <Empty description="未找到相似的解决方案，请尝试添加相关知识条目" />
          ) : (
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>找到 {results.length} 个相似结果</Title>
              {results.map(item => (
                <SearchResult key={item.id} item={item} baseURL={baseURL} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
