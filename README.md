# 小元AI

**小元AI** 是一个 [Obsidian](https://obsidian.md) 插件，将 AI 能力深度集成到你的笔记工作流中。支持双助手系统（小A + 小C）、@ 委托、后台并行执行、文本润色与维基管理。

---

## 功能特色

| 中文 | English |
|------|---------|
| 🧑‍🤝‍🧑 双助手系统（小A + 小C），可命名可换头像 | 🧑‍🤝‍🧑 Dual assistants (小A + 小C), customizable names and avatars |
| 🎯 `@小A` / `@小C` 直接点名路由 | 🎯 Route messages with `@name` mentions |
| 🔄 前台回复中 `@小C` → 后台静默执行，完成后冒泡 | 🔄 Background delegation via `@mention` in replies |
| 💬 AI 聊天面板，支持多会话 | 💬 Multi-session chat panel |
| ✍️ 选中文本后操作：润色、总结、补全、扩写、翻译、续写 | ✍️ Right-click operations: polish, summarize, complete, expand, translate, continue |
| 📎 附件上传（图片、PDF、文本文件） | 📎 File attachments (images, PDFs, text files) |
| 📊 文件变更 Diff 预览 | 📊 File diff preview |
| 🔄 流式响应 | 🔄 Streaming responses |
| 🔊 状态栏朗读指示器 | 🔊 Speaking indicator in status bar |
| ⏰ 定时 Skill 自动执行 | ⏰ Scheduled skill execution |

---

## 双助手系统

小A 和 小C 是两个平级的 AI 助手，共享同一会话但各有分工：

| 助手 | 默认执行通道 | 能力定位 |
|------|-------------|----------|
| 小A | API | 对话、写作、分析、翻译 |
| 小C | CLI (opencode) | 文件操作、命令执行、项目操作 |

### @ 路由

```
用户: @小C 帮我统计项目文件数量         → 小C 直接回复
用户: @小A 帮我写一段文案              → 小A 直接回复
用户: 帮我看看这个项目结构怎么样        → 当前默认助手回复
```

### 后台委托

前台助手在回复中以 `@小C` 引用任务时，插件自动截取任务并在后台执行，完成后冒泡显示：

```
小A: 我来分析代码结构。@小C 读取 src/ 目录文件
     (插件后台调起小C，不阻塞对话)
     ...
小C: src/ 下有以下文件:
     main.ts
     utils.ts
     ...
```

### 配置

在设置中可以分别修改小A / 小C 的：

- **名称** — 不修改则使用默认名
- **头像图标** — Obsidian 图标名
- **系统提示词** — 自定义角色定位

API 设置页 → 小A 配置
CLI 设置页 → 小C 配置

---

## 执行模式

插件支持两种底层执行通道，由小A/小C 各自独立使用：

| 通道 | 使用方 | 说明 |
|------|--------|------|
| CLI | 小C | 通过 `opencode run` 执行，适合文件操作。需安装 [opencode](https://opencode.ai) CLI |
| API | 小A | 直接调用 OpenAI 兼容 API，适合纯对话 |

切换"智能助理模式"仅决定**默认**使用哪个助手，`@` 路由不受限制。

---

## 安装

### 手动安装

1. 从 [Releases](https://github.com/ziwensite/xiaoyuanAI/releases) 下载最新 `xiaoyuanAI-v*.zip`
2. 解压到 `.obsidian/plugins/xiaoyuanAI/`
3. 在 Obsidian 设置 → 第三方插件 → 启用"小元AI"

### 从源码构建

```bash
git clone <repo-url>
cd xiaoyuanAI
npm install
npm run build
```

将 `main.js`、`manifest.json`、`styles.css` 复制到插件目录。

---

## 设置

打开 Obsidian 设置 → 小元AI，进入设置面板。

### 状态卡片

顶部 5 行实时显示：CLI 连接状态、API 连接状态、CLI 模型、API 模型、代理。两部连接各自独立检测。

### 通用设置

| 选项 | 说明 |
|------|------|
| 智能助理模式 | API（小A 前台）或 CLI（小C 前台） |
| 代理 | HTTP 代理配置 |
| 启动时自动打开侧栏 | 插件加载后自动打开聊天面板 |
| 选中捕获命令 | 捕获按钮触发的 Obsidian 命令 |
| 聊天历史存储路径 | 会话文件的存储目录 |
| 聊天面板位置 | 左侧或右侧 |
| Diff 预览 | 显示文件变更预览 |
| 显示思考过程 | 折叠显示模型思考过程 |
| 附件大小上限 | 附件大小限制（MB） |
| 系统提示词 | 自定义 AI 角色设定 |

### API 设置（小A）

| 选项 | 说明 |
|------|------|
| API 提供者 | 管理多个 API 端点 |
| 思考强度 / 温度 / 最大 Token | 模型输出参数 |
| 小A 配置 | 名称、头像图标、系统提示词 |

### CLI 设置（小C）

| 选项 | 说明 |
|------|------|
| OpenCode 路径 | opencode 可执行文件路径 |
| 自动启动 Server | 插件启动时自动运行 `opencode serve` |
| Host / Port | opencode 服务器地址 |
| 模型 / Agent / 思考强度 / 文件权限 | opencode 执行参数 |
| 小C 配置 | 名称、头像图标、系统提示词 |

---

## AGENTS.md 与技能

在聊天输入框中使用 `/` 可触发已有技能，支持：

- `/skillName` — 调用 AGENTS.md 中定义的 skill
- `@小A` / `@小C` — 弹出助手选择
- 定时 Skill 自动执行

---

## 开发

```bash
npm install          # 安装依赖
npm run dev          # 开发模式（watch）
npm run build        # 生产构建
```

### Release 发布

```bash
git tag v1.x.x
git push --tags
```

GitHub Actions 自动: build → package (`main.js` + `manifest.json` + `styles.css`) → create Release。

---

## License

MIT