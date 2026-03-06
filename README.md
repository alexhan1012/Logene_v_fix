# 知识库管理系统 (Knowledge Base System)

IT 现场工程师智能知识库 — 基于多模态 AI 的故障报修知识管理与检索系统。

## 功能特点

- **知识录入**：上传报错截图 + 文字描述 + 解决方案，自动通过 VLM 分析生成结构化故障信息
- **智能检索**：上传新的报错截图或输入问题描述，通过向量相似度检索历史知识库找到解决方案
- **多模态 AI**：集成火山引擎 (Volcano Engine) VLM、Embedding 等多种模型
- **多模型支持**：可配置选择不同的 VLM、Embedding、Text 模型
- **现代化 UI**：Electron 桌面客户端，React + Ant Design 构建

## 技术架构

```
┌─────────────────────────┐     ┌──────────────────────────┐
│   Electron Client       │     │   Express Server         │
│   (React + Ant Design)  │────▶│   (Node.js)              │
│                         │     │                          │
│ • 知识检索              │     │ • REST API               │
│ • 知识库管理            │     │ • VLM 图像分析           │
│ • 新增记录              │     │ • Embedding 向量化       │
│ • 设置                  │     │ • 向量相似度检索         │
└─────────────────────────┘     └────────┬─────────────────┘
                                         │
                         ┌───────────────┼───────────────┐
                         │               │               │
                         ▼               ▼               ▼
                 ┌──────────────┐ ┌────────────┐ ┌──────────────┐
                 │ PostgreSQL   │ │ 火山引擎   │ │ 文件存储     │
                 │ + pgvector   │ │ VLM API    │ │ (uploads/)   │
                 └──────────────┘ └────────────┘ └──────────────┘
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端框架 | Electron + React 18 |
| UI 组件库 | Ant Design 5 |
| 构建工具 | Vite |
| 后端框架 | Express.js |
| 数据库 | PostgreSQL + pgvector |
| AI 服务 | 火山引擎 (Volcano Engine) |
| VLM 模型 | Doubao Vision Pro |
| Embedding | Doubao Embedding Large |

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14（需安装 [pgvector](https://github.com/pgvector/pgvector) 扩展）
- 火山引擎 API Key

### 1. 数据库准备

```bash
# 安装 pgvector 扩展（以 Ubuntu 为例）
sudo apt install postgresql-14-pgvector

# 创建数据库
createdb knowledge_base
```

### 2. 启动后端服务

```bash
cd server

# 安装依赖
npm install

# 配置环境变量（可选，已内置默认值）
cp .env.example .env
# 编辑 .env 设置数据库连接和 API Key

# 启动服务
npm start
# 或开发模式
npm run dev
```

服务将在 `http://localhost:3001` 启动。

### 3. 启动客户端

```bash
cd client

# 安装依赖
npm install

# 开发模式（浏览器）
npm run dev

# Electron 开发模式
npm run electron:dev

# 构建生产版本
npm run build
```

## 项目结构

```
├── server/                     # 后端服务
│   ├── src/
│   │   ├── index.js           # 服务入口
│   │   ├── config/            # 配置文件
│   │   ├── db/                # 数据库连接与初始化
│   │   ├── middleware/        # 中间件（文件上传、限流）
│   │   ├── routes/            # API 路由
│   │   │   ├── knowledge.js   # 知识条目 CRUD
│   │   │   ├── search.js      # 智能检索
│   │   │   └── settings.js    # 设置管理
│   │   └── services/          # 业务逻辑
│   │       ├── volcEngine.js  # 火山引擎 API
│   │       └── knowledge.js   # 知识库服务
│   └── package.json
├── client/                     # Electron 客户端
│   ├── electron/              # Electron 主进程
│   ├── src/
│   │   ├── main.jsx           # React 入口
│   │   ├── App.jsx            # 主布局
│   │   ├── api/               # API 客户端
│   │   ├── pages/             # 页面组件
│   │   └── components/        # 通用组件
│   └── package.json
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/knowledge` | 创建知识条目 |
| GET | `/api/knowledge` | 列表（分页） |
| GET | `/api/knowledge/:id` | 获取详情 |
| PUT | `/api/knowledge/:id` | 更新 |
| DELETE | `/api/knowledge/:id` | 删除 |
| POST | `/api/search` | 智能检索 |
| GET | `/api/models` | 可用模型列表 |
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |

## 工作流程

### 入库阶段
1. 用户上传报错截图 + 文字描述 + 解决方案
2. VLM 模型分析图片，提取结构化故障信息（现象、错误码、关键词等）
3. 将分析结果 + 原始描述进行向量化（Embedding）
4. 存储到 PostgreSQL（含 pgvector 向量索引）

### 检索阶段
1. 用户上传新的报错截图和/或输入问题描述
2. VLM 模型分析查询内容，生成结构化描述
3. 对描述进行向量化
4. 通过余弦相似度在向量库中检索最相似的历史记录
5. 返回匹配结果及相似度评分

## 许可证

MIT