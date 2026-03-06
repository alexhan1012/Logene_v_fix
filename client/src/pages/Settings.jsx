import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Typography,
  Divider,
  Alert,
  Spin,
  message,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';

const { Title } = Typography;

export default function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, modelsRes] = await Promise.all([
        api.settings.get().catch(() => ({ data: {} })),
        api.models.list().catch(() => ({ data: [] })),
      ]);
      const settings = settingsRes.data.data || settingsRes.data || {};
      const modelList = modelsRes.data.data || modelsRes.data || [];
      setModels(modelList);
      form.setFieldsValue({
        vlm_model: settings.vlm_model,
        embedding_model: settings.embedding_model,
        text_model: settings.text_model,
        api_key: settings.api_key,
        api_base_url: settings.api_base_url,
        server_url: settings.server_url || 'http://localhost:3001',
      });
    } catch (err) {
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await api.settings.update(values);
      message.success('设置保存成功');
    } catch (err) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const vlmModels = models.filter((m) => m.type === 'vlm');
  const embeddingModels = models.filter((m) => m.type === 'embedding');
  const textModels = models.filter((m) => m.type === 'text');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          设置
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <Alert
        message="配置说明"
        description="配置 AI 模型和 API 连接参数。修改后点击保存按钮生效。如果模型列表为空，请先确认后端服务已启动。"
        type="info"
        showIcon
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSave} requiredMark="optional">
        {/* Model Configuration */}
        <Card
          title="模型配置"
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
        >
          <Form.Item label="VLM 模型（视觉语言模型）" name="vlm_model">
            <Select
              placeholder="选择 VLM 模型"
              allowClear
              showSearch
              options={vlmModels.map((m) => ({ label: m.name || m.id, value: m.id || m.name }))}
              notFoundContent="暂无可用模型"
            />
          </Form.Item>
          <Form.Item label="Embedding 模型（向量嵌入模型）" name="embedding_model">
            <Select
              placeholder="选择 Embedding 模型"
              allowClear
              showSearch
              options={embeddingModels.map((m) => ({ label: m.name || m.id, value: m.id || m.name }))}
              notFoundContent="暂无可用模型"
            />
          </Form.Item>
          <Form.Item label="Text 模型（文本生成模型）" name="text_model">
            <Select
              placeholder="选择 Text 模型"
              allowClear
              showSearch
              options={textModels.map((m) => ({ label: m.name || m.id, value: m.id || m.name }))}
              notFoundContent="暂无可用模型"
            />
          </Form.Item>
        </Card>

        {/* API Configuration */}
        <Card
          title="API 配置"
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
        >
          <Form.Item label="API Key" name="api_key">
            <Input.Password placeholder="输入 API Key" />
          </Form.Item>
          <Form.Item label="API Base URL" name="api_base_url">
            <Input placeholder="例如：https://api.openai.com/v1" />
          </Form.Item>
        </Card>

        {/* Server Configuration */}
        <Card
          title="服务器配置"
          style={{ borderRadius: 12, marginBottom: 24 }}
          styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
        >
          <Form.Item label="后端服务器地址" name="server_url">
            <Input placeholder="http://localhost:3001" />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            size="large"
            style={{ minWidth: 160 }}
          >
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
