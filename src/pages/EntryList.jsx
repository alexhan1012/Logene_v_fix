import React, { useEffect, useState } from 'react'
import { Table, Card, Input, Button, Space, Popconfirm, Typography, Tag, message, Modal, Image, Descriptions } from 'antd'
import { SearchOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Search } = Input

export default function EntryList({ baseURL }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [viewEntry, setViewEntry] = useState(null)

  async function load(p = page, ps = pageSize, s = search) {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/entries?page=${p}&pageSize=${ps}&search=${encodeURIComponent(s)}`)
      const data = await res.json()
      if (data.success) {
        setEntries(data.data)
        setTotal(data.total)
      }
    } catch (e) {
      message.error('加载失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    try {
      const res = await fetch(`${baseURL}/api/entries/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        message.success('已删除')
        load()
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      message.error('删除失败：' + e.message)
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Button type="link" onClick={() => setViewEntry(record)} style={{ padding: 0 }}>
          {text}
        </Button>
      ),
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: text => <Text ellipsis>{text}</Text>,
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => setViewEntry(record)} />
          <Popconfirm
            title="确认删除？"
            description="此操作不可恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>浏览条目</Title>
      <Card style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索标题、描述、解决方案..."
            allowClear
            style={{ width: 300 }}
            onSearch={s => { setSearch(s); setPage(1); load(1, pageSize, s) }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => load()}>刷新</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{
            total,
            current: page,
            pageSize,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); load(p, ps, search) },
          }}
        />
      </Card>

      <Modal
        open={!!viewEntry}
        title={viewEntry?.title}
        onCancel={() => setViewEntry(null)}
        footer={null}
        width={800}
      >
        {viewEntry && (
          <div>
            {viewEntry.image_url && (
              <div style={{ marginBottom: 16 }}>
                <Image src={`${baseURL}${viewEntry.image_url}`} style={{ maxWidth: '100%' }} />
              </div>
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="问题描述">
                <Paragraph style={{ margin: 0 }}>{viewEntry.description}</Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="解决方案">
                <Paragraph style={{ margin: 0 }}>{viewEntry.solution}</Paragraph>
              </Descriptions.Item>
              {viewEntry.vlm_analysis && (
                <Descriptions.Item label="AI分析">
                  <Text type="secondary">
                    {typeof viewEntry.vlm_analysis === 'string'
                      ? JSON.parse(viewEntry.vlm_analysis).summary
                      : viewEntry.vlm_analysis.summary}
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="添加时间">
                {dayjs(viewEntry.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}
