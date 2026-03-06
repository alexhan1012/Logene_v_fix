import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Steps, Typography, Alert, Progress } from 'antd'
import { PlusOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import ImageUpload from '../components/ImageUpload'

const { TextArea } = Input
const { Title, Text } = Typography

export default function AddEntry({ baseURL }) {
  const [form] = Form.useForm()
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(values) {
    setLoading(true)
    setSuccess(false)
    setProgress(10)
    setProgressText('准备提交...')

    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('description', values.description)
      formData.append('solution', values.solution)
      if (imageFile) {
        formData.append('image', imageFile)
        setProgressText('正在分析图片...')
      } else {
        setProgressText('正在分析文本...')
      }
      setProgress(30)

      const res = await fetch(`${baseURL}/api/entries`, {
        method: 'POST',
        body: formData,
      })

      setProgress(80)
      setProgressText('正在生成向量嵌入...')

      const data = await res.json()
      setProgress(100)

      if (data.success) {
        setProgressText('添加成功！')
        setSuccess(true)
        message.success('知识条目已成功添加！')
        form.resetFields()
        setImageFile(null)
      } else {
        throw new Error(data.error || '添加失败')
      }
    } catch (e) {
      message.error('添加失败：' + e.message)
    } finally {
      setLoading(false)
      setTimeout(() => {
        setProgress(0)
        setProgressText('')
      }, 2000)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>添加知识条目</Title>
      <Card style={{ borderRadius: 12, maxWidth: 800 }}>
        {success && (
          <Alert
            message="添加成功"
            description="知识条目已成功保存到数据库，可以在搜索时找到它。"
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setSuccess(false)}
          />
        )}

        {loading && progress > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text>{progressText}</Text>
            <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="简要描述这个问题，如：MySQL连接超时错误" size="large" />
          </Form.Item>

          <Form.Item label="错误截图（可选）">
            <ImageUpload onChange={setImageFile} value={imageFile} />
          </Form.Item>

          <Form.Item
            label="问题描述"
            name="description"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="详细描述错误现象、复现步骤、系统环境等..."
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="解决方案"
            name="solution"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea
              rows={6}
              placeholder="详细描述解决方案、操作步骤..."
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={loading ? <LoadingOutlined /> : <PlusOutlined />}
              style={{ width: '100%', height: 48, borderRadius: 8, fontSize: 16 }}
            >
              {loading ? progressText || '处理中...' : '添加知识条目'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
