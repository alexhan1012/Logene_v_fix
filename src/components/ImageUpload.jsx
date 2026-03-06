import React, { useState } from 'react'
import { Upload, Button, Image, Space, Typography } from 'antd'
import { UploadOutlined, DeleteOutlined, FileImageOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function ImageUpload({ onChange, value }) {
  const [preview, setPreview] = useState(null)

  function handleFile(file) {
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
    onChange(file)
    return false
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
  }

  if (preview) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          padding: 8,
          display: 'inline-block',
          maxWidth: '100%',
        }}>
          <Image src={preview} style={{ maxHeight: 200, maxWidth: '100%', display: 'block' }} />
        </div>
        <Button icon={<DeleteOutlined />} onClick={handleRemove} danger size="small">
          移除图片
        </Button>
      </Space>
    )
  }

  return (
    <Upload.Dragger
      beforeUpload={handleFile}
      accept="image/*"
      showUploadList={false}
      style={{ borderRadius: 8 }}
    >
      <div style={{ padding: '20px 0' }}>
        <FileImageOutlined style={{ fontSize: 32, color: '#667eea', marginBottom: 8 }} />
        <p style={{ margin: '8px 0 4px' }}><b>点击或拖拽上传截图</b></p>
        <Text type="secondary" style={{ fontSize: 12 }}>支持 PNG、JPG、JPEG 格式</Text>
      </div>
    </Upload.Dragger>
  )
}
