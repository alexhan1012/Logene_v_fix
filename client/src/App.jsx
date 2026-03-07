import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, theme } from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import Search from './pages/Search';
import KnowledgeList from './pages/KnowledgeList';
import KnowledgeCreate from './pages/KnowledgeCreate';
import KnowledgeDetail from './pages/KnowledgeDetail';
import Settings from './pages/Settings';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <SearchOutlined />, label: '知识检索' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/knowledge/create', icon: <PlusCircleOutlined />, label: '新增记录' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();

  const selectedKey = (() => {
    const path = location.pathname;
    if (path === '/') return '/';
    const match = menuItems.find((item) => item.key !== '/' && path.startsWith(item.key));
    return match ? match.key : '/';
  })();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <DatabaseOutlined
            style={{ fontSize: 24, color: token.colorPrimary, flexShrink: 0 }}
          />
          {!collapsed && (
            <Title
              level={4}
              style={{
                margin: '0 0 0 12px',
                whiteSpace: 'nowrap',
                color: token.colorPrimary,
              }}
            >
              知识库
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            border: 'none',
            background: 'transparent',
            marginTop: 8,
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            知识库管理系统
          </Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            IT 现场工程师智能知识库
          </Typography.Text>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: token.colorBgLayout,
            overflow: 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/knowledge" element={<KnowledgeList />} />
            <Route path="/knowledge/create" element={<KnowledgeCreate />} />
            <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
