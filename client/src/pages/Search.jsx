import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Input,
  Button,
  Card,
  Tag,
  Empty,
  Spin,
  Space,
  message,
  theme,
} from 'antd';
import { SearchOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ImageUpload from '../components/ImageUpload';
import api from '../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Search() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!image && !description.trim()) {
      message.warning('请上传截图或输入问题描述');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (image) formData.append('image', image);
      if (description.trim()) formData.append('text_description', description.trim());

      const res = await api.search(formData);
      setResults(res.data.data || res.data.results || []);
    } catch (err) {
      message.error(err.message || '检索失败');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'orange';
    return 'default';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px 36px',
          background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
          borderRadius: 16,
          marginBottom: 32,
        }}
      >
        <ThunderboltOutlined
          style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }}
        />
        <Title level={2} style={{ marginBottom: 8 }}>
          智能故障检索
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          上传报错截图或描述问题，快速找到解决方案
        </Text>

        <div style={{ marginTop: 32, maxWidth: 680, margin: '32px auto 0' }}>
          <div style={{ marginBottom: 16 }}>
            <ImageUpload value={image} onChange={setImage} />
          </div>
          <TextArea
            rows={3}
            placeholder="请描述遇到的问题或错误信息..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ borderRadius: 8, marginBottom: 16, fontSize: 15 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="large"
            loading={loading}
            onClick={handleSearch}
            style={{ minWidth: 180, height: 48, fontSize: 16, borderRadius: 8 }}
          >
            开始检索
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <Spin spinning={loading}>
        {results === null ? null : results.length === 0 ? (
          <Empty description="未找到相关结果，请尝试其他描述" style={{ marginTop: 48 }} />
        ) : (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              检索结果 ({results.length})
            </Title>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {results.map((item, idx) => (
                <Card
                  key={item.id || idx}
                  hoverable
                  onClick={() => item.id && navigate(`/knowledge/${item.id}`)}
                  style={{ borderRadius: 12 }}
                  styles={{ body: { padding: 20 } }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <Title level={5} style={{ margin: 0, flex: 1 }}>
                      {item.title || `记录 #${item.id || idx + 1}`}
                    </Title>
                    <Space>
                      {item.similarity != null && (
                        <Tag color={getSimilarityColor(item.similarity)}>
                          匹配度 {(item.similarity * 100).toFixed(1)}%
                        </Tag>
                      )}
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.id) navigate(`/knowledge/${item.id}`);
                        }}
                      >
                        查看详情
                      </Button>
                    </Space>
                  </div>
                  {item.error_description && (
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 8 }}
                    >
                      <Text strong>错误描述：</Text>
                      {item.error_description}
                    </Paragraph>
                  )}
                  {item.solution && (
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                      <Text strong>解决方案：</Text>
                      {item.solution}
                    </Paragraph>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {item.tags.map((tag) => (
                        <Tag key={tag} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </Space>
          </div>
        )}
      </Spin>
    </div>
  );
}
