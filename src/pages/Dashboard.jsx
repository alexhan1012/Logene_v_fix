import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, List, Avatar, Typography, Spin, Empty } from 'antd'
import { DatabaseOutlined, CalendarOutlined, ClockCircleOutlined, FileImageOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Title } = Typography

export default function Dashboard({ baseURL }) {
  const [stats, setStats] = useState({ total: 0, this_month: 0, today: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch(`${baseURL}/api/entries/stats`),
          fetch(`${baseURL}/api/entries?page=1&pageSize=5`),
        ])
        const statsData = await statsRes.json()
        const recentData = await recentRes.json()

        if (statsData.success) {
          setStats(statsData.data)
        }
        if (recentData.success) {
          setRecent(recentData.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [baseURL])

  const cardStyle = (gradient) => ({
    borderRadius: 12,
    background: gradient,
    color: '#fff',
    border: 'none',
  })

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>仪表盘</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card style={cardStyle('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>知识条目总数</span>}
              value={stats.total}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#fff', fontSize: 32 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={cardStyle('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>本月新增</span>}
              value={stats.this_month}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fff', fontSize: 32 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={cardStyle('linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)')}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日新增</span>}
              value={stats.today}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fff', fontSize: 32 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近添加" style={{ marginTop: 24, borderRadius: 12 }}>
        {recent.length === 0 ? (
          <Empty description="暂无条目，请先添加知识条目" />
        ) : (
          <List
            dataSource={recent}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.image_url
                      ? <Avatar src={`${baseURL}${item.image_url}`} shape="square" size={48} icon={<FileImageOutlined />} />
                      : <Avatar shape="square" size={48} icon={<FileImageOutlined />} style={{ background: '#667eea' }} />
                  }
                  title={<Text strong>{item.title}</Text>}
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      <br />
                      <Text ellipsis style={{ maxWidth: 400 }}>{item.description}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
