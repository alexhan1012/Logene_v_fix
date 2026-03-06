import React, { useState } from 'react'
import { Card, Badge, Typography, Button, Modal, Descriptions, Image, Tag, Space, Collapse } from 'antd'
import { BulbOutlined, FileImageOutlined, ExpandOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Paragraph, Title } = Typography

export default function SearchResult({ item, baseURL }) {
  const [modalOpen, setModalOpen] = useState(false)
  const similarity = Math.round((item.similarity || 0) * 100)

  const getBadgeColor = (sim) => {
    if (sim >= 85) return '#52c41a'
    if (sim >= 70) return '#1890ff'
    if (sim >= 55) return '#faad14'
    return '#ff4d4f'
  }

  const getSimilarityLabel = (sim) => {
    if (sim >= 85) return '高度匹配'
    if (sim >= 70) return '较好匹配'
    if (sim >= 55) return '一般匹配'
    return '低匹配'
  }

  const vlmAnalysis = item.vlm_analysis
    ? (typeof item.vlm_analysis === 'string' ? JSON.parse(item.vlm_analysis) : item.vlm_analysis)
    : null

  return (
    <>
      <Card
        style={{ borderRadius: 12, marginBottom: 12, borderLeft: `4px solid ${getBadgeColor(similarity)}` }}
        extra={
          <Space>
            <Tag color={getBadgeColor(similarity)} style={{ fontSize: 13, padding: '2px 10px' }}>
              {similarity}% {getSimilarityLabel(similarity)}
            </Tag>
            <Button
              icon={<ExpandOutlined />}
              size="small"
              onClick={() => setModalOpen(true)}
            >
              查看详情
            </Button>
          </Space>
        }
        title={
          <Space>
            <BulbOutlined style={{ color: getBadgeColor(similarity) }} />
            <Text strong>{item.title}</Text>
          </Space>
        }
      >
        {vlmAnalysis?.summary && (
          <div style={{ background: '#f6f8ff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>AI分析摘要</Text>
            <br />
            <Text>{vlmAnalysis.summary}</Text>
          </div>
        )}

        <Collapse
          ghost
          items={[{
            key: '1',
            label: <Text strong style={{ color: '#52c41a' }}>解决方案（点击展开）</Text>,
            children: <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.solution}</Paragraph>,
          }]}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={item.title}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
      >
        {item.image_url && (
          <div style={{ marginBottom: 16 }}>
            <Image src={`${baseURL}${item.image_url}`} style={{ maxWidth: '100%' }} />
          </div>
        )}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="匹配度">
            <Tag color={getBadgeColor(similarity)}>{similarity}% {getSimilarityLabel(similarity)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="问题描述">
            <Paragraph style={{ margin: 0 }}>{item.description}</Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="解决方案">
            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.solution}</Paragraph>
          </Descriptions.Item>
          {vlmAnalysis && (
            <>
              {vlmAnalysis.phenomenon && (
                <Descriptions.Item label="问题现象">{vlmAnalysis.phenomenon}</Descriptions.Item>
              )}
              {vlmAnalysis.error_codes && (
                <Descriptions.Item label="错误码">{vlmAnalysis.error_codes}</Descriptions.Item>
              )}
              {vlmAnalysis.system_state && (
                <Descriptions.Item label="系统状态">{vlmAnalysis.system_state}</Descriptions.Item>
              )}
            </>
          )}
          <Descriptions.Item label="添加时间">
            {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  )
}
