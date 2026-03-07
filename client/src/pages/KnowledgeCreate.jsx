import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Typography,
  message,
  Space,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import ImageUpload from '../components/ImageUpload';
import api from '../api';

const { Title } = Typography;
const { TextArea } = Input;

export default function KnowledgeCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (values.title) formData.append('title', values.title);
      if (image) formData.append('image', image);
      formData.append('error_description', values.error_description);
      formData.append('solution', values.solution);
      if (values.tags && values.tags.length > 0) {
        formData.append('tags', JSON.stringify(values.tags));
      }

      await api.knowledge.create(formData);
      message.success('创建成功');
      navigate('/knowledge');
    } catch (err) {
      message.error(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate(-1)}
          style={{ marginRight: 12 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          新增知识记录
        </Title>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Form.Item label="标题" name="title">
            <Input placeholder="输入标题（可选，留空将自动生成）" />
          </Form.Item>

          <Form.Item label="报错截图">
            <ImageUpload value={image} onChange={setImage} />
          </Form.Item>

          <Form.Item
            label="错误描述"
            name="error_description"
            rules={[{ required: true, message: '请输入错误描述' }]}
          >
            <TextArea rows={4} placeholder="详细描述遇到的错误或问题..." />
          </Form.Item>

          <Form.Item
            label="解决方案"
            name="solution"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <TextArea rows={6} placeholder="详细描述解决步骤和方法..." />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select
              mode="tags"
              placeholder="输入标签后按回车添加"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                size="large"
              >
                保存记录
              </Button>
              <Button size="large" onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
