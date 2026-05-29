# 小元AI

**小元AI** 是一个 [Obsidian](https://obsidian.md) 插件，将 AI 能力（聊天、文本润色、维基管理）无缝集成到你的笔记工作流中。

**XiaoyuanAI** is an [Obsidian](https://obsidian.md) plugin that brings AI capabilities — chat, text polishing, and wiki management — directly into your note-taking workflow.

---

## 功能 / Features

| 中文 | English |
|------|---------|
| 💬 AI 聊天面板，支持多会话 | 💬 AI chat panel with multi-session support |
| ✍️ 选中文本后右键润色/总结/补全/扩写/翻译/续写 | ✍️ Right-click text operations: polish, summarize, complete, expand, translate, continue |
| 🔍 Wiki 查询、捕捉、摄入命令 | 🔍 Wiki query, capture, and ingest commands |
| 📎 附件上传（图片、PDF、文本文件） | 📎 File attachments (images, PDFs, text files) |
| 📊 文件变更 Diff 预览 | 📊 File diff preview |
| 🔄 流式响应用于即时反馈 | 🔄 Streaming responses for real-time feedback |

---

## 执行模式 / Execution Modes

插件支持两种运行模式，可在设置中切换：

The plugin supports two execution modes, switchable in settings:

### CLI 模式 / CLI Mode

通过 `opencode run` 子进程执行，适合需要读取/修改工作区文件的场景。支持 agent 切换、工具调用、MCP 扩展。

Executes via `opencode run` subprocess. Best for tasks that need file read/write access. Supports agent switching, tool calls, and MCP extensions.

**前置条件 / Prerequisites:** 安装 [opencode](https://opencode.ai) CLI 工具。

### API 模式 / API Mode

直接调用 OpenAI 兼容 API（支持任意兼容端点），适合纯对话场景，无需本地 CLI。

Calls OpenAI-compatible APIs directly (any compatible endpoint), ideal for chat-only scenarios without a local CLI.

---

## 安装 / Installation

### 手动安装 / Manual Install

1. 下载最新 release 的 `main.js`、`manifest.json`、`styles.css`
2. 放入你的 Obsidian 库目录下的 `.obsidian/plugins/xiaoyuanAI/`
3. 在 Obsidian 设置 → 第三方插件 → 启用"小元AI"

### 从源码构建 / Build from Source

```bash
git clone <repo-url>
cd xiaoyuanAI
npm install
npm run build
```

将 `main.js`、`manifest.json`、`styles.css` 复制到你的插件目录。

---

## 配置 / Configuration

打开 Obsidian 设置 → 小元AI，进入设置面板：

Open Obsidian Settings → 小元AI to access the configuration panel.

### CLI 设置 / CLI Settings

| 选项 | 说明 |
|------|------|
| OpenCode 路径 | opencode 可执行文件路径 |
| 自动启动 Server | 插件启动时自动运行 `opencode serve` |
| Host / Port | opencode 服务器地址 |
| 模型 | 选择 AI 模型（可从 opencode 同步） |
| Agent | 选择 agent 类型（build / plan 等） |
| 思考强度 | 推理深度控制 |
| 文件权限 | AI 对工作区文件的访问级别 |

### API 设置 / API Settings

| 选项 | 说明 |
|------|------|
| API 提供者 | 管理多个 API 端点（名称、Base URL、模型、API Key） |
| 思考强度 | API 端推理深度 |
| 温度 / 最大 Token | 模型输出参数 |

### 通用设置 / General Settings

| 选项 | 说明 |
|------|------|
| 代理 | HTTP 代理配置 |
| MCP 工具 | 启用 MCP 扩展（开发中） |
| 聊天历史路径 | 会话文件的存储目录 |
| 聊天面板位置 | 左侧或右侧 |
| 系统提示词 | 自定义 AI 角色设定 |

---

## 开发 / Development

```bash
npm install          # 安装依赖 / Install dependencies
npm run dev          # 开发模式（watch）/ Dev mode (watch)
npm run build        # 生产构建 / Production build
```

---

## License

MIT
