import React, { useState } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import Search from './pages/Search'
import EntryList from './pages/EntryList'
import Settings from './pages/Settings'

const { Sider, Content } = Layout
const { Title } = Typography

const BASE_URL = (window.api && window.api.baseURL) ? window.api.baseURL : 'http://localhost:3001'

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/add', icon: <PlusCircleOutlined />, label: '添加条目' },
  { key: '/search', icon: <SearchOutlined />, label: '搜索' },
  { key: '/entries', icon: <UnorderedListOutlined />, label: '浏览条目' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{ background: '#001529', WebkitAppRegion: 'no-drag' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          WebkitAppRegion: 'drag',
        }}>
          {!collapsed && (
            <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16 }}>
              🧠 Logene 知识库
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#001529' }}
        />
      </Sider>
      <Layout>
        <div style={{ WebkitAppRegion: 'drag', height: 38, background: '#f0f2f5' }} />
        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 38px)', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard baseURL={BASE_URL} />} />
            <Route path="/add" element={<AddEntry baseURL={BASE_URL} />} />
            <Route path="/search" element={<Search baseURL={BASE_URL} />} />
            <Route path="/entries" element={<EntryList baseURL={BASE_URL} />} />
            <Route path="/settings" element={<Settings baseURL={BASE_URL} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}
