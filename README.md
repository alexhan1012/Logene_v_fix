# Logene 知识库

一个面向实施工程师的智能报修知识库系统，基于 Electron + React + PostgreSQL + pgvector + 火山引擎 VLM 构建。

## 功能特性

- 📷 **多模态报错录入**：支持上传报错截图 + 文字描述 + 解决方案，利用 VLM（视觉大语言模型）深度解析截图内容
- 🔍 **语义向量搜索**：通过向量相似度检索历史报修记录，精准匹配类似问题
- 🤖 **AI 自动分析**：入库时自动调用 VLM 提取问题现象、错误码、受影响组件，生成结构化描述用于向量化
- 🎯 **多模型支持**：可在设置页自由选择 VLM 模型、Embedding 模型、文本模型
- 📊 **知识库管理**：支持浏览、搜索、删除知识条目

## 技术栈

| 层级 | 技术 |
|------|------|
| 客户端 | Electron 35 |
| 前端框架 | React 18 + Ant Design 5 |
| 构建工具 | Vite 6 |
| 后端 | Express 4（内嵌于 Electron 主进程） |
| 数据库 | PostgreSQL + pgvector |
| AI API | 火山引擎 ARK API（OpenAI 兼容） |

## 快速开始

### 前置条件

1. Node.js 18+
2. PostgreSQL（需安装 pgvector 扩展）

### 安装 PostgreSQL + pgvector

```bash
# macOS (Homebrew)
brew install postgresql
brew install pgvector

# Ubuntu/Debian
sudo apt-get install postgresql
sudo apt-get install postgresql-15-pgvector

# 创建数据库
psql -U postgres -c "CREATE DATABASE knowledge_base;"
```

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

这会同时启动：
- Vite 开发服务器（端口 5173）
- Express 后端（端口 3001）
- Electron 主窗口

### 生产构建

```bash
npm run build   # 构建前端
npm start       # 启动 Electron（使用构建产物）
```

## 配置

首次启动后，进入**设置**页面配置：

### 数据库设置
- 主机：`localhost`
- 端口：`5432`
- 数据库名：`knowledge_base`
- 用户名：`postgres`
- 密码：（你的 PostgreSQL 密码）

### API 设置
- API Key：默认已内置火山引擎 API Key
- VLM 模型：用于图像分析（推荐 Doubao 1.5 Vision Pro 32K）
- Embedding 模型：用于向量化（推荐 Doubao Embedding）
- 文本模型：用于纯文本分析（推荐 Doubao 1.5 Pro 32K）

## 使用流程

### 添加知识条目
1. 进入**添加条目**页
2. 填写标题
3. 上传报错截图（可选）
4. 填写问题描述
5. 填写解决方案
6. 点击**添加知识条目**

系统会自动：
- 调用 VLM 分析截图，提取问题现象、错误码等结构化信息
- 对结构化描述进行向量化
- 将所有信息存入 PostgreSQL 数据库

### 搜索解决方案
1. 进入**搜索**页
2. 上传遇到的报错截图（可选）
3. 输入问题描述
4. 点击**搜索相似解决方案**

系统会：
- 调用 VLM 分析你的报错截图
- 对分析结果向量化
- 在数据库中进行余弦相似度搜索
- 返回最相似的历史解决方案

## 支持的模型

### VLM 模型（图像分析）
- `doubao-1-5-vision-pro-32k`（推荐）
- `doubao-1-5-vision-lite-32k`
- `doubao-vision-pro-32k`

### Embedding 模型（向量化，2048维）
- `doubao-embedding`（推荐）
- `doubao-embedding-large`

### 文本模型（纯文本分析）
- `doubao-1-5-pro-32k`（推荐）
- `doubao-1-5-lite-32k`
- `doubao-pro-32k`

## 项目结构

```
├── electron/
│   ├── main.js          # Electron 主进程
│   └── preload.cjs      # 预加载脚本
├── src/                 # React 渲染进程
│   ├── App.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── AddEntry.jsx
│   │   ├── Search.jsx
│   │   ├── EntryList.jsx
│   │   └── Settings.jsx
│   └── components/
│       ├── ImageUpload.jsx
│       └── SearchResult.jsx
├── server/              # Express 后端
│   ├── index.js
│   ├── routes/
│   │   ├── entries.js
│   │   ├── search.js
│   │   └── settings.js
│   ├── services/
│   │   ├── volcanoEngine.js
│   │   └── db.js
│   └── db/
│       └── schema.sql
├── package.json
├── vite.config.js
└── index.html
```
