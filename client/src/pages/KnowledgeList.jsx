import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Typography,
  Popconfirm,
  message,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../api';

const { Title } = Typography;

export default function KnowledgeList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [searchText, setSearchText] = useState('');

  const fetchData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await api.knowledge.list(page, pageSize);
      const result = res.data.data || res.data;
      setData(result.items || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: result.total || 0,
      }));
    } catch (err) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.knowledge.delete(id);
      message.success('删除成功');
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  const filteredData = searchText
    ? data.filter(
        (item) =>
          (item.title || '').includes(searchText) ||
          (item.error_description || '').includes(searchText) ||
          (item.tags || []).some((t) => t.includes(searchText))
      )
    : data;

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => navigate(`/knowledge/${record.id}`)}>
          {text || `记录 #${record.id}`}
        </a>
      ),
    },
    {
      title: '错误描述',
      dataIndex: 'error_description',
      key: 'error_description',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) =>
        tags && tags.length > 0 ? (
          <>
            {tags.slice(0, 3).map((tag) => (
              <Tag color="blue" key={tag}>
                {tag}
              </Tag>
            ))}
            {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
          </>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => (text ? new Date(text).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/knowledge/${record.id}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定删除此记录？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          知识库
        </Title>
        <Space>
          <Input.Search
            placeholder="搜索标题、描述或标签..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/knowledge/create')}
          >
            新增记录
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchData(page, pageSize),
          }}
        />
      </Card>
    </div>
  );
}
