import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  Image,
  Popconfirm,
  Descriptions,
  Divider,
  message,
  theme,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import api, { SERVER_BASE } from '../api';

const { Title, Paragraph, Text } = Typography;

export default function KnowledgeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.knowledge.get(id);
        setData(res.data.data || res.data);
      } catch (err) {
        message.error(err.message || '加载详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.knowledge.delete(id);
      message.success('删除成功');
      navigate('/knowledge');
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Title level={4}>未找到该记录</Title>
        <Button type="primary" onClick={() => navigate('/knowledge')}>
          返回列表
        </Button>
      </div>
    );
  }

  const imageUrl = data.image_path
    ? `${SERVER_BASE}${data.image_path}`
    : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => navigate(-1)}
          />
          <Title level={4} style={{ margin: 0 }}>
            {data.title || `记录 #${data.id}`}
          </Title>
        </Space>
        <Space>
          <Popconfirm
            title="确定删除此记录？"
            description="删除后无法恢复"
            onConfirm={handleDelete}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {imageUrl && (
        <Card
          style={{ borderRadius: 12, marginBottom: 16, textAlign: 'center' }}
          styles={{ body: { padding: 16 } }}
        >
          <Image
            src={imageUrl}
            alt="报错截图"
            style={{ maxHeight: 400, objectFit: 'contain' }}
          />
        </Card>
      )}

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          错误描述
        </Title>
        <Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>
          {data.error_description || '无'}
        </Paragraph>
      </Card>

      <Card
        style={{
          borderRadius: 12,
          marginBottom: 16,
          borderLeft: `4px solid ${token.colorSuccess}`,
        }}
      >
        <Title level={5} style={{ marginTop: 0, color: token.colorSuccess }}>
          解决方案
        </Title>
        <Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>
          {data.solution || '无'}
        </Paragraph>
      </Card>

      {data.vlm_analysis && (
        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <Title level={5} style={{ marginTop: 0 }}>
            VLM 分析结果
          </Title>
          <Paragraph
            style={{
              fontSize: 14,
              whiteSpace: 'pre-wrap',
              background: token.colorFillQuaternary,
              padding: 16,
              borderRadius: 8,
              fontFamily: 'monospace',
            }}
          >
            {typeof data.vlm_analysis === 'string'
              ? data.vlm_analysis
              : JSON.stringify(data.vlm_analysis, null, 2)}
          </Paragraph>
        </Card>
      )}

      <Card style={{ borderRadius: 12 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="标签">
            {data.tags && data.tags.length > 0 ? (
              data.tags.map((tag) => (
                <Tag color="blue" key={tag}>
                  {tag}
                </Tag>
              ))
            ) : (
              <Text type="secondary">无</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <CalendarOutlined style={{ marginRight: 6 }} />
            {data.created_at
              ? new Date(data.created_at).toLocaleString('zh-CN')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            <CalendarOutlined style={{ marginRight: 6 }} />
            {data.updated_at
              ? new Date(data.updated_at).toLocaleString('zh-CN')
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
