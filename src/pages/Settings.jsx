import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Card, Select, message, Typography, Divider, Space, Alert } from 'antd'
import { SaveOutlined, ApiOutlined, DatabaseOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function Settings({ baseURL }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [models, setModels] = useState({ vlm: [], embedding: [], text: [] })
  const [testStatus, setTestStatus] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [settingsRes, modelsRes] = await Promise.all([
          fetch(`${baseURL}/api/settings`),
          fetch(`${baseURL}/api/settings/models`),
        ])
        const settingsData = await settingsRes.json()
        const modelsData = await modelsRes.json()

        if (settingsData.success) {
          form.setFieldsValue(settingsData.data)
        }
        if (modelsData.success) {
          setModels(modelsData.data)
        }
      } catch (e) {
        message.error('加载设置失败：' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [baseURL])

  async function handleSave(values) {
    setSaving(true)
    try {
      const res = await fetch(`${baseURL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (data.success) {
        message.success('设置已保存')
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      message.error('保存失败：' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTestDB() {
    setTestStatus('testing')
    try {
      const res = await fetch(`${baseURL}/api/health`)
      const data = await res.json()
      setTestStatus(data.status === 'ok' ? 'success' : 'error')
    } catch {
      setTestStatus('error')
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>设置</Title>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Card
          title={<Space><DatabaseOutlined />数据库设置</Space>}
          style={{ borderRadius: 12, marginBottom: 16 }}
          extra={
            <Button onClick={handleTestDB} loading={testStatus === 'testing'}>
              测试连接
            </Button>
          }
        >
          {testStatus === 'success' && <Alert type="success" message="连接成功" style={{ marginBottom: 16 }} />}
          {testStatus === 'error' && <Alert type="error" message="连接失败" style={{ marginBottom: 16 }} />}

          <Form.Item label="数据库主机" name="db_host">
            <Input placeholder="localhost" />
          </Form.Item>
          <Form.Item label="端口" name="db_port">
            <Input placeholder="5432" />
          </Form.Item>
          <Form.Item label="数据库名" name="db_name">
            <Input placeholder="knowledge_base" />
          </Form.Item>
          <Form.Item label="用户名" name="db_user">
            <Input placeholder="postgres" />
          </Form.Item>
          <Form.Item label="密码" name="db_password">
            <Input.Password placeholder="数据库密码" />
          </Form.Item>
        </Card>

        <Card
          title={<Space><ApiOutlined />API & 模型设置</Space>}
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          <Form.Item label="API Key" name="api_key">
            <Input.Password placeholder="Volcano Engine API Key" />
          </Form.Item>

          <Form.Item label="VLM 模型（图像分析）" name="vlm_model">
            <Select options={models.vlm} placeholder="选择VLM模型" />
          </Form.Item>

          <Form.Item label="Embedding 模型（向量化）" name="embedding_model">
            <Select options={models.embedding} placeholder="选择Embedding模型" />
          </Form.Item>

          <Form.Item label="文本模型" name="text_model">
            <Select options={models.text} placeholder="选择文本模型" />
          </Form.Item>

          <Divider />

          <Form.Item label="搜索结果数量" name="search_limit">
            <Input type="number" min={1} max={20} />
          </Form.Item>

          <Form.Item label="相似度阈值（0-1）" name="similarity_threshold">
            <Input type="number" min={0} max={1} step={0.05} />
          </Form.Item>
        </Card>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={saving}
          icon={<SaveOutlined />}
          style={{ width: '100%', height: 48, borderRadius: 8, fontSize: 16 }}
        >
          保存设置
        </Button>
      </Form>
    </div>
  )
}
