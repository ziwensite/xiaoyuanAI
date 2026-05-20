import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  ItemView,
  WorkspaceLeaf,
  Notice,
  Modal,
} from "obsidian";

interface XiaoyuanAISettings {
  execMode: "api" | "cli" | "hybrid";
  opencodePath: string;
  serverPort: number;
  serverPassword: string;
  apiEndpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  chatViewType: "left" | "right";
  buildMode: "plan" | "build";
  level: "low" | "medium" | "high" | "max";
}

const DEFAULT_SETTINGS: XiaoyuanAISettings = {
  execMode: "hybrid",
  opencodePath: "opencode",
  serverPort: 16226,
  serverPassword: "",
  apiEndpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o",
  systemPrompt: "你是一个 AI 助手，集成在 Obsidian 笔记软件中。用户正在做笔记或写作。请用中文回答，保持简洁专业。",
  maxTokens: 4096,
  temperature: 0.7,
  chatViewType: "right",
  buildMode: "build",
  level: "low",
};

export const VIEW_TYPE_XIAOYUAN_AI_CHAT = "xiaoyuan-chat-view";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ─── OpenCode Server (HTTP API client) ──────────────────────────────────────

interface Attachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

interface Part {
  type: string;
  text?: string;
  id: string;
  image?: string;
  file?: string;
}

interface MessageResponse {
  info: Record<string, any>;
  parts: Part[];
}

let serverProcess: any = null;
let serverStartPromise: Promise<void> | null = null;
const EXTERNAL_SERVER = {};

async function probeServer(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const http = require("http");
    const req = http.get(`http://localhost:${port}/config/providers`, (res: any) => {
      res.on("data", () => {});
      res.on("end", () => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

function startOpenCodeServer(opencodePath: string, port: number, password: string, vaultDir: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const alive = await probeServer(port);
    if (alive) {
      serverProcess = EXTERNAL_SERVER;
      serverStartPromise = Promise.resolve();
      resolve();
      return;
    }

    try {
      const cp = require("child_process");
      const proc = cp.spawn("cmd.exe", ["/c", opencodePath, "serve", "--port", String(port)], {
        cwd: vaultDir,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, OPENCODE_SERVER_PASSWORD: password },
      });

      serverProcess = proc;

      let started = false;
      const onData = (chunk: Buffer) => {
        const text = chunk.toString();
        if (!started && text.includes("listening")) {
          started = true;
          resolve();
        }
      };
      proc.stdout.on("data", onData);
      proc.stderr.on("data", onData);

      proc.on("error", (err: Error) => {
        reject(err);
      });
      proc.on("close", (code: number) => {
        if (serverProcess === proc) serverProcess = null;
        if (!started) {
          serverStartPromise = null;
          reject(new Error(`opencode serve 异常退出（${code}）`));
        }
      });

      setTimeout(() => {
        if (!started) {
          started = true;
          resolve();
        }
      }, 15000);
    } catch (err: any) {
      reject(err);
    }
  });
}

function stopOpenCodeServer(): Promise<void> {
  if (!serverProcess || serverProcess === EXTERNAL_SERVER) {
    serverProcess = null;
    serverStartPromise = null;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const proc = serverProcess;
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        serverProcess = null;
        serverStartPromise = null;
        resolve();
      }
    };

    proc.on("close", done);
    proc.on("error", done);

    try {
      proc.kill("SIGTERM");
    } catch {}

    setTimeout(done, 3000);
  });
}

async function httpRequest(url: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; body: () => Promise<string>; json: () => Promise<any> }> {
  const { method = "GET", headers = {}, body } = options;
  const parsedUrl = new URL(url);
  const http = require("http") as typeof import("http");

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({
            status: res.statusCode ?? 0,
            body: async () => text,
            json: async () => JSON.parse(text),
          });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function callOpenCodeAPI(
  prompt: string,
  port: number,
  password: string,
  attachments?: Attachment[],
  agent?: string,
  level?: string,
): Promise<string> {
  const baseUrl = `http://localhost:${port}`;
  const auth = Buffer.from(`opencode:${password}`).toString("base64");
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  const parts: any[] = [{ type: "text", text: prompt }];
  if (attachments) {
    for (const att of attachments) {
      if (att.type.startsWith("image/")) {
        parts.push({ type: "image", image: att.data });
      } else {
        parts.push({ type: "file", file: att.data, name: att.name });
      }
    }
  }

  const body: any = { parts };
  if (agent) body.agent = agent;
  if (level) body.level = level;

  const sessionResp = await httpRequest(`${baseUrl}/session`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title: "xiaoyuan-plugin" }),
  });
  if (sessionResp.status < 200 || sessionResp.status >= 300) {
    const txt = await sessionResp.body().catch(() => "");
    throw new Error(`创建会话失败（${sessionResp.status}）：${txt.slice(0, 200)}`);
  }
  const sessionData: any = await sessionResp.json();
  const sessionId: string = sessionData.id;

  try {
    const msgResp = await httpRequest(`${baseUrl}/session/${sessionId}/message`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (msgResp.status < 200 || msgResp.status >= 300) {
      const txt = await msgResp.body().catch(() => "");
      throw new Error(`发送消息失败（${msgResp.status}）：${txt.slice(0, 200)}`);
    }
    const msgData: MessageResponse = await msgResp.json();

    const textParts = msgData.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("\n");
    if (textParts) return textParts;

    const anyText = msgData.parts
      .filter((p) => p.text)
      .map((p) => p.text!)
      .join("\n");
    return anyText || "(无响应内容)";
  } finally {
    try {
      await httpRequest(`${baseUrl}/session/${sessionId}`, { method: "DELETE", headers });
    } catch {}
  }
}

async function ensureServer(s: XiaoyuanAISettings, vaultDir: string): Promise<void> {
  if (serverProcess) return;
  if (serverStartPromise) {
    try { await serverStartPromise; return; }
    catch { serverStartPromise = null; }
  }

  const pw = s.serverPassword || "xiaoyuan-plugin-" + Math.random().toString(36).slice(2, 10);
  if (!s.serverPassword) s.serverPassword = pw;

  const alive = await probeServer(s.serverPort);
  if (alive) {
    serverProcess = EXTERNAL_SERVER;
    return;
  }

  serverStartPromise = startOpenCodeServer(s.opencodePath, s.serverPort, pw, vaultDir).catch((err) => {
    serverStartPromise = null;
    throw err;
  });
  await serverStartPromise;
}

async function callOpenCodeCLI(prompt: string, settings: XiaoyuanAISettings, vaultDir: string, attachments?: Attachment[]): Promise<string> {
  await ensureServer(settings, vaultDir);
  return callOpenCodeAPI(prompt, settings.serverPort, settings.serverPassword, attachments, settings.buildMode, settings.level);
}

class XiaoyuanAIChatView extends ItemView {
  plugin: XiaoyuanAIPlugin;
  messages: ChatMessage[] = [];
  private viewContainer!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private inputContainer!: HTMLDivElement;
  private inputEl!: HTMLTextAreaElement;
  private sendBtn!: HTMLSpanElement;
  private modeLabel!: HTMLSpanElement;

  constructor(leaf: WorkspaceLeaf, plugin: XiaoyuanAIPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_XIAOYUAN_AI_CHAT; }
  getDisplayText(): string { return "小元"; }
  getIcon(): string { return "message-circle"; }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("xiaoyuan-chat-container");

    this.viewContainer = contentEl.createDiv({ cls: "xiaoyuan-chat" });

    const headerEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-header" });

    const leftContainer = document.createElement("span");
    leftContainer.classList.add("xiaoyuan-chat-header-left");

    const arrowLeft = document.createElement("span");
    arrowLeft.classList.add("xiaoyuan-mode-arrow");
    arrowLeft.textContent = "▼";
    leftContainer.appendChild(arrowLeft);

    const modes = [
      { value: "api", label: "API" },
      { value: "hybrid", label: "混合" },
      { value: "cli", label: "CLI" },
    ];
    
    const modeText = this.createSelector(
      "xiaoyuan-mode-selector",
      modes,
      this.plugin.settings.execMode,
      "点击切换执行模式",
      (value) => {
        this.plugin.settings.execMode = value as "api" | "cli" | "hybrid";
        this.plugin.saveSettings();
        this.refresh();
      }
    );
    leftContainer.appendChild(modeText);

    headerEl.appendChild(leftContainer);

    const settingsIcon = document.createElement("span");
    settingsIcon.classList.add("xiaoyuan-settings-icon");
    settingsIcon.title = "设置";
    settingsIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';
    settingsIcon.addEventListener("click", () => {
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById("xiaoyuanAI");
    });
    headerEl.appendChild(settingsIcon);

    this.messagesEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-messages" });

    this.inputContainer = this.viewContainer.createDiv({ cls: "xiaoyuan-input-container" });

    this.inputEl = this.inputContainer.createEl("textarea", {
      cls: "xiaoyuan-chat-input",
      attr: { placeholder: "输入你的问题..." },
    });

    const toolbarEl = this.inputContainer.createDiv({ cls: "xiaoyuan-toolbar" });

    const attachBtn = document.createElement("span");
    attachBtn.title = "添加附件";
    attachBtn.classList.add("xiaoyuan-attach-btn");
    attachBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    toolbarEl.appendChild(attachBtn);

    const buildModes = [{ value: "plan", label: "plan" }, { value: "build", label: "build" }];
    const buildModeText = this.createSelector(
      "xiaoyuan-build-mode-select",
      buildModes,
      this.plugin.settings.buildMode,
      "点击切换构建模式",
      (value) => {
        this.plugin.settings.buildMode = value as "plan" | "build";
        this.plugin.saveSettings();
      },
      true
    );
    toolbarEl.appendChild(buildModeText);

    const models = [
      { value: "gpt-4o", label: "gpt-4o" },
      { value: "gpt-4", label: "gpt-4" },
      { value: "gpt-3.5-turbo", label: "gpt-3.5" },
    ];
    const modelText = this.createSelector(
      "xiaoyuan-model-select",
      models,
      this.plugin.settings.model,
      "点击切换模型",
      (value) => {
        this.plugin.settings.model = value;
        this.plugin.saveSettings();
      },
      true
    );
    toolbarEl.appendChild(modelText);

    const levels = [
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
      { value: "max", label: "max" },
    ];
    const levelText = this.createSelector(
      "xiaoyuan-level-select",
      levels,
      this.plugin.settings.level,
      "点击切换级别",
      (value) => {
        this.plugin.settings.level = value as "low" | "medium" | "high" | "max";
        this.plugin.saveSettings();
      },
      true
    );
    toolbarEl.appendChild(levelText);

    this.sendBtn = this.createSendButton();
    this.sendBtn.addEventListener("click", () => this.sendMessage());
    toolbarEl.appendChild(this.sendBtn);

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });

    this.addWelcomeMessage();
  }

  private createSelector(
    className: string,
    options: { value: string; label: string }[],
    currentValue: string,
    title: string,
    onChange: (value: string) => void,
    dropdownUp = false
  ): HTMLSpanElement {
    const text = document.createElement("span");
    text.classList.add(className);
    const currentOption = options.find((m) => m.value === currentValue);
    text.textContent = currentOption?.label || options[0]?.label || "";
    text.setAttribute("title", title);
    text.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".xiaoyuan-mode-dropdown").forEach((el) => el.remove());
      const dropdown = document.createElement("div");
      dropdown.classList.add("xiaoyuan-mode-dropdown");
      if (dropdownUp) dropdown.classList.add("xiaoyuan-mode-dropdown-up");
      options.forEach((m) => {
        const item = document.createElement("div");
        item.classList.add("xiaoyuan-mode-dropdown-item");
        if (m.value === currentValue) item.classList.add("active");
        item.textContent = m.label;
        item.addEventListener("click", () => {
          text.textContent = m.label;
          onChange(m.value);
          dropdown.remove();
        });
        dropdown.appendChild(item);
      });
      text.appendChild(dropdown);
      const closeDropdown = (ev: MouseEvent) => {
        if (!dropdown.contains(ev.target as Node)) {
          dropdown.remove();
          document.removeEventListener("click", closeDropdown);
        }
      };
      setTimeout(() => document.addEventListener("click", closeDropdown), 0);
    });
    return text;
  }

  private createSendButton(): HTMLSpanElement {
    const btn = document.createElement("span");
    btn.title = "发送";
    btn.classList.add("xiaoyuan-attach-btn");
    btn.style.marginLeft = "auto";
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
    return btn;
  }

  private addWelcomeMessage() {
    const s = this.plugin.settings;
    const modeInfo = s.execMode === "cli"
      ? `当前模式：CLI（opencode serve）`
      : s.execMode === "hybrid"
        ? `当前模式：混合（操作→CLI, 聊天→API）`
        : `当前模式：API（直接调用）`;
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant xiaoyuan-welcome" });
    const bubble = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });
    bubble.innerHTML = `👋 你好！我是小元。<br><br>${modeInfo}<br><br>我可以帮你：<br>• 💬 聊天对话<br>• ✍️ 润色、总结、补全笔记<br>• 🔍 查询维基知识<br><br>选中文本后右键 → 使用 AI 操作。`;
  }

  private msgIdCounter = 0;

  private async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.addMessage("user", text);
    this.inputEl.value = "";
    this.disableInput(true);
    try {
      const response = await this.callAI(text);
      this.addMessage("assistant", response);
    } catch (err: any) {
      this.addMessage("assistant", `❌ 错误：${err.message}`);
    } finally {
      this.disableInput(false);
      this.inputEl.focus();
    }
  }

  public addMessage(role: "user" | "assistant", content: string) {
    const id = "msg-" + (++this.msgIdCounter);
    this.messages.push({ id, role, content });
    const msgEl = this.messagesEl.createDiv({ cls: `xiaoyuan-msg xiaoyuan-msg-${role}` });
    msgEl.id = id;

    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });

    if (role === "user") {
      const textEl = bubbleEl.createSpan();
      textEl.textContent = content;

      const undoBtn = msgEl.createSpan({ cls: "xiaoyuan-msg-action xiaoyuan-undo-btn" });
      undoBtn.textContent = "↩";
      undoBtn.title = "撤销此消息";
      undoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.undoMessage(id);
      });
    } else {
      bubbleEl.innerHTML = this.renderMarkdown(content.trim());
      const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
      const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
      copyBtn.textContent = "📋";
      copyBtn.title = "复制";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(content);
        new Notice("已复制");
      });
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private undoMessage(id: string) {
    const idx = this.messages.findIndex(m => m.id === id);
    if (idx === -1) return;
    this.messages = this.messages.slice(0, idx);
    const msgEls = this.messagesEl.querySelectorAll(".xiaoyuan-msg");
    for (let i = msgEls.length - 1; i >= idx; i--) {
      msgEls[i].remove();
    }
    new Notice("已撤销");
  }

  private renderMarkdown(text: string): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let h = esc(text);
    h = h
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^- (.+)$/gm, "• $1")
      .replace(/\n/g, "<br>");
    return h;
  }

  private async callAI(userMessage: string): Promise<string> {
    const s = this.plugin.settings;

    if (s.execMode === "cli") {
      const vaultDir = (this.app.vault.adapter as any).getBasePath();
      const allMessages = [
        { role: "system" as const, content: s.systemPrompt },
        ...this.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: userMessage },
      ];
      const prompt = allMessages.map(m => `${m.role === "system" ? "[系统]" : m.role === "user" ? "[用户]" : "[助手]"}: ${m.content}`).join("\n\n");
      return callOpenCodeCLI(prompt, s, vaultDir);
    }

    if (!s.apiKey) throw new Error("API Key 未配置。请在设置中填写。");
    
    const body: any = {
      model: s.model,
      messages: [
        { role: "system" as const, content: s.systemPrompt },
        ...this.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: userMessage },
      ],
      max_tokens: s.maxTokens,
      temperature: s.temperature,
      stream: false,
    };

    const resp = await fetch(s.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.apiKey}` },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "（无响应）";
  }

  private disableInput(disabled: boolean) {
    this.inputEl.disabled = disabled;
    if (disabled) {
      this.sendBtn.classList.add("disabled");
    } else {
      this.sendBtn.classList.remove("disabled");
    }
  }

  refresh() {
    this.messages = [];
    this.messagesEl.empty();
    this.addWelcomeMessage();
  }

  async onClose() { this.viewContainer.empty(); }
}

const OPERATION_PROMPTS: Record<string, string> = {
  polish: "你是一个文字润色助手。请润色以下文本，改进表达、语法和流畅度，保持原意不变。只输出润色后的结果，不要添加任何解释：\n\n",
  summarize: "你是一个总结助手。请对以下文本进行简洁的总结，提取关键要点。用中文总结，只输出总结内容：\n\n",
  complete: "你是一个写作助手。请根据上下文，自然地补全以下内容，保持风格一致：\n\n",
  expand: "你是一个写作助手。请扩写以下内容，增加细节、例子和深度，保留原文的核心观点：\n\n",
  translate: "你是一个翻译助手。请将以下文本翻译成中文，保持专业性和流畅度：\n\n",
  continue: "你是一个写作助手。请根据以下内容自然地续写，保持风格一致：\n\n",
};

const OPERATION_LABELS: Record<string, string> = {
  polish: "润色", summarize: "总结", complete: "补全",
  expand: "扩写", translate: "翻译为中文", continue: "续写",
};

class TextOperationModal extends Modal {
  plugin: XiaoyuanAIPlugin;
  operation: string;
  inputText: string;
  resultEl!: HTMLDivElement;
  loadingEl!: HTMLDivElement;
  modeLabel!: HTMLSpanElement;

  constructor(app: App, plugin: XiaoyuanAIPlugin, operation: string, inputText: string) {
    super(app);
    this.plugin = plugin;
    this.operation = operation;
    this.inputText = inputText;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.classList.add("xiaoyuan-modal-container");

    const headerRow = contentEl.createDiv({ cls: "xiaoyuan-modal-header" });
    headerRow.createEl("h3", { text: `AI ${OPERATION_LABELS[this.operation] || this.operation}` });
    this.modeLabel = headerRow.createSpan({ cls: "xiaoyuan-modal-mode-label" });
    this.modeLabel.textContent = this.plugin.settings.execMode === "cli" ? "CLI" : "API";

    this.loadingEl = contentEl.createDiv({ cls: "xiaoyuan-modal-loading", text: "\u23F3 处理中..." });

    this.resultEl = contentEl.createDiv({ cls: "xiaoyuan-modal-result" });

    this.processOperation();
  }

  private async processOperation() {
    try {
      const s = this.plugin.settings;
      const prompt = (OPERATION_PROMPTS[this.operation] || OPERATION_PROMPTS.polish) + this.inputText;
      let result: string;

      if (s.execMode === "cli" || s.execMode === "hybrid") {
        this.modeLabel.textContent = "CLI";
        const vaultDir = (this.app.vault.adapter as any).getBasePath();
        result = await callOpenCodeCLI(prompt, s, vaultDir);
      } else {
        this.modeLabel.textContent = "API";
        if (!s.apiKey) { new Notice("API Key 未配置"); this.close(); return; }
        const resp = await fetch(s.apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.apiKey}` },
          body: JSON.stringify({
            model: s.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: s.maxTokens,
            temperature: s.temperature,
            stream: false,
          }),
        });
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const data = await resp.json();
        result = data.choices?.[0]?.message?.content || "（无响应）";
      }

      this.loadingEl.classList.add("hidden");
      this.resultEl.classList.add("show");
      this.resultEl.textContent = result;

      const btnRow = this.contentEl.createDiv({ cls: "xiaoyuan-modal-btn-row" });

      const replaceBtn = btnRow.createEl("button", { text: "替换原文", cls: "xiaoyuan-btn-primary" });
      replaceBtn.addEventListener("click", () => {
        const editor = this.plugin.getActiveEditor();
        if (editor) { editor.replaceSelection(result); new Notice("已替换"); }
        else new Notice("未找到活动编辑器");
        this.close();
      });

      const copyBtn = btnRow.createEl("button", { text: "复制结果", cls: "xiaoyuan-btn-secondary" });
      copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(result); new Notice("已复制"); });

      const closeBtn = btnRow.createEl("button", { text: "关闭", cls: "xiaoyuan-btn-secondary" });
      closeBtn.addEventListener("click", () => this.close());
    } catch (err: any) {
      this.loadingEl.textContent = `\u274C 错误：${err.message}`;
    }
  }

  onClose() { this.contentEl.empty(); }
}

const WIKI_SYSTEM_PROMPTS: Record<string, string> = {
  query: "你是一个维基知识库的检索助手。根据用户的问题，从知识库角度给出综合性的回答。如果不知道，就诚实说不知道。",
  capture: "你正在将用户提供的内容整理为维基笔记。请提取关键信息，分类（concept/skill/reference/decision），输出带 YAML frontmatter 的 Obsidian Markdown 格式。",
  ingest: "你正在摄入文档。请分析内容，蒸馏出核心概念、实体、技能，用中文输出多个维基页面（带 frontmatter 和 [[维基链接]]）。",
};

class WikiCommandModal extends Modal {
  plugin: XiaoyuanAIPlugin;
  command: string;

  constructor(app: App, plugin: XiaoyuanAIPlugin, command: string) {
    super(app);
    this.plugin = plugin;
    this.command = command;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.classList.add("xiaoyuan-wiki-modal-container");

    contentEl.createEl("h3", { text: `\u{1F9E0} Wiki 命令：/${this.command}` });

    const inputEl = contentEl.createEl("textarea", {
      cls: "xiaoyuan-wiki-input",
      attr: { placeholder: this.command === "query" ? "输入查询内容..." : "输入要保存的内容..." },
    });

    const btnRow = contentEl.createDiv({ cls: "xiaoyuan-wiki-btn-row" });

    const submitBtn = btnRow.createEl("button", { text: "执行", cls: "xiaoyuan-btn-primary" });

    const resultEl = contentEl.createDiv({ cls: "xiaoyuan-wiki-result" });

    submitBtn.addEventListener("click", async () => {
      const text = inputEl.value.trim();
      if (!text) { new Notice("请输入内容"); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = "处理中...";

      try {
        const s = this.plugin.settings;
        const systemPrompt = WIKI_SYSTEM_PROMPTS[this.command] || "";
        let result: string;

        if (s.execMode === "cli" || s.execMode === "hybrid") {
          const fullPrompt = systemPrompt ? `${systemPrompt}\n\n---\n${text}` : text;
          const vaultDir = (this.app.vault.adapter as any).getBasePath();
          result = await callOpenCodeCLI(fullPrompt, s, vaultDir);
        } else {
          if (!s.apiKey) { new Notice("请先在设置中配置 API Key"); return; }
          const resp = await fetch(s.apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.apiKey}` },
            body: JSON.stringify({
              model: s.model,
              messages: [
                ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
                { role: "user" as const, content: text },
              ],
              max_tokens: s.maxTokens,
              temperature: s.temperature,
              stream: false,
            }),
          });
          const data = await resp.json();
          result = data.choices?.[0]?.message?.content || "（无响应）";
        }

        resultEl.classList.add("show");
        resultEl.textContent = result;
      } catch (err: any) {
        resultEl.classList.add("show");
        resultEl.textContent = `\u274C 错误：${err.message}`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "执行";
      }
    });

    const closeBtn = btnRow.createEl("button", { text: "关闭", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());
  }
}

class XiaoyuanAISettingTab extends PluginSettingTab {
  plugin: XiaoyuanAIPlugin;
  constructor(app: App, plugin: XiaoyuanAIPlugin) { super(app, plugin); this.plugin = plugin; }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "小元 设置" });

    new Setting(containerEl)
      .setName("执行模式")
      .setDesc("选择如何调用 AI 能力")
      .addDropdown((dd) => {
        dd.addOption("hybrid", "\u{1F310} 混合模式（操作\u2192CLI, 聊天\u2192API）");
        dd.addOption("cli", "\u{1F4BB} CLI 模式（全部通过 opencode serve）");
        dd.addOption("api", "\u2601\uFE0F API 模式（直接调用 API）");
        dd.setValue(this.plugin.settings.execMode);
        dd.onChange(async (val) => {
          this.plugin.settings.execMode = val as any;
          await this.plugin.saveSettings();
          this.display();
        });
      });

    const s = this.plugin.settings;

    if (s.execMode === "cli" || s.execMode === "hybrid") {
      containerEl.createEl("h3", { text: "CLI 配置" });
      new Setting(containerEl)
        .setName("opencode 路径")
        .setDesc("opencode 可执行文件路径。全局安装填 opencode 即可。")
        .addText((text) =>
          text.setPlaceholder("opencode")
            .setValue(s.opencodePath)
            .onChange(async (val) => { s.opencodePath = val; await this.plugin.saveSettings(); })
        );

      new Setting(containerEl)
        .setName("服务器端口")
        .setDesc("opencode serve 的监听端口")
        .addText((text) =>
          text.setPlaceholder("16226")
            .setValue(String(s.serverPort))
            .onChange(async (val) => { const n = parseInt(val); if (n > 0 && n < 65536) { s.serverPort = n; await this.plugin.saveSettings(); } })
        );

      new Setting(containerEl)
        .setName("默认构建模式")
        .setDesc("plan = 规划优先，build = 直接执行")
        .addDropdown((dd) => {
          dd.addOption("plan", "plan");
          dd.addOption("build", "build");
          dd.setValue(s.buildMode);
          dd.onChange(async (val) => { s.buildMode = val as "plan" | "build"; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("默认级别")
        .setDesc("opencode 的执行级别（low / medium / high / max）")
        .addDropdown((dd) => {
          dd.addOption("low", "low");
          dd.addOption("medium", "medium");
          dd.addOption("high", "high");
          dd.addOption("max", "max");
          dd.setValue(s.level);
          dd.onChange(async (val) => { s.level = val as "low" | "medium" | "high" | "max"; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("测试 CLI 连接")
        .setDesc("启动/测试 opencode serve 是否正常")
        .addButton((btn) => {
          btn.setButtonText("测试连接");
          btn.onClick(async () => {
            btn.disabled = true;
            btn.setButtonText("检测中...");
            try {
              const pw = s.serverPassword || "xiaoyuan-plugin-" + Math.random().toString(36).slice(2, 10);
              if (!s.serverPassword) { s.serverPassword = pw; await this.plugin.saveSettings(); }

              const alive = await probeServer(s.serverPort);
              if (alive) {
                new Notice("\u2705 检测到已有服务器在运行");
                btn.setButtonText("已有服务");
                return;
              }

              btn.setButtonText("启动中...");
              const vaultDir = (this.app.vault.adapter as any).getBasePath();
              await startOpenCodeServer(s.opencodePath, s.serverPort, pw, vaultDir);
              const result = await callOpenCodeAPI("回复 OK", s.serverPort, pw);
              new Notice(`\u2705 opencode 连接成功：${result}`);
            } catch (err: any) {
              new Notice(`\u274C CLI 失败：${err.message}`);
            } finally {
              btn.disabled = false;
              btn.setButtonText("测试连接");
            }
          });
        });
    }

    if (s.execMode === "api" || s.execMode === "hybrid") {
      containerEl.createEl("h3", { text: "API 配置" });
      new Setting(containerEl)
        .setName("API 端点")
        .setDesc("OpenAI 兼容的 API 地址")
        .addText((text) =>
          text.setPlaceholder("https://api.openai.com/v1/chat/completions")
            .setValue(s.apiEndpoint)
            .onChange(async (val) => { s.apiEndpoint = val; await this.plugin.saveSettings(); })
        );

      new Setting(containerEl)
        .setName("API Key")
        .setDesc("你的 API 密钥")
        .addText((text) => {
          text.setPlaceholder("sk-...").setValue(s.apiKey);
          text.inputEl.type = "password";
          text.onChange(async (val) => { s.apiKey = val; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("模型")
        .addText((text) =>
          text.setPlaceholder("gpt-4o").setValue(s.model)
            .onChange(async (val) => { s.model = val; await this.plugin.saveSettings(); })
        );

      new Setting(containerEl)
        .setName("系统提示词")
        .addTextArea((text) => {
          text.setValue(s.systemPrompt);
          text.inputEl.rows = 4;
          text.onChange(async (val) => { s.systemPrompt = val; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("最大 Token 数")
        .addText((text) =>
          text.setPlaceholder("4096").setValue(String(s.maxTokens))
            .onChange(async (val) => { const n = parseInt(val); if (n > 0) { s.maxTokens = n; await this.plugin.saveSettings(); } })
        );

      new Setting(containerEl)
        .setName("温度")
        .addSlider((slider) =>
          slider.setLimits(0, 2, 0.1).setValue(s.temperature)
            .onChange(async (val) => { s.temperature = val; await this.plugin.saveSettings(); })
        );
    }

    containerEl.createEl("hr");
    containerEl.createEl("h3", { text: "帮助" });
    const help = containerEl.createDiv();
    help.innerHTML = `
      <p><strong>执行模式说明：</strong></p>
      <p>\u2022 <strong>混合模式（默认）</strong>：文本操作和 Wiki 命令走 opencode serve，聊天走 API。最佳体验。</p>
      <p>\u2022 <strong>CLI 模式</strong>：所有操作通过 opencode serve 执行。</p>
      <p>\u2022 <strong>API 模式</strong>：所有操作直接调用 API。</p>
      <p><strong>文本操作：</strong>在编辑器中选中文本 \u2192 右键 \u2192 "使用 AI" 子菜单</p>
      <p><strong>聊天：</strong>点击左侧 Ribbon 栏的 \u{1F4AC} 图标打开聊天面板</p>
      <p><strong>Wiki 命令：</strong>通过命令面板搜索 "小元" 找到维基命令</p>
    `;
    help.classList.add("xiaoyuan-help-text");
  }
}

export default class XiaoyuanAIPlugin extends Plugin {
  settings!: XiaoyuanAISettings;

  async onload() {
    serverProcess = null;
    serverStartPromise = null;

    await this.loadSettings();

    this.registerView(VIEW_TYPE_XIAOYUAN_AI_CHAT, (leaf) => new XiaoyuanAIChatView(leaf, this));
    this.addRibbonIcon("message-circle", "小元", () => this.activateChatView());

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        if (!sel) return;
        const ops = ["polish", "summarize", "complete", "expand", "translate", "continue"];
        ops.forEach((op) => {
          menu.addItem((item) => {
            item.setTitle(`AI ${OPERATION_LABELS[op]}`);
            item.setIcon(op === "polish" ? "pencil" : op === "summarize" ? "align-justify" : "plus");
            item.onClick(() => new TextOperationModal(this.app, this, op, sel).open());
          });
        });
      })
    );

    this.addCommand({ id: "xiaoyuanAI-toggle-chat", name: "切换小元聊天面板", callback: () => this.activateChatView() });
    ["polish", "summarize", "complete", "expand", "translate", "continue"].forEach((op) => {
      this.addCommand({
        id: `xiaoyuanAI-${op}`,
        name: `AI ${OPERATION_LABELS[op]}选中文本`,
        editorCallback: (editor) => {
          const text = editor.getSelection();
          if (text) new TextOperationModal(this.app, this, op, text).open();
        },
      });
    });

    this.addCommand({ id: "xiaoyuanAI-wiki-query", name: "\u{1F50D} Wiki 查询", callback: () => new WikiCommandModal(this.app, this, "query").open() });
    this.addCommand({ id: "xiaoyuanAI-wiki-capture", name: "\u{1F4E5} Wiki 捕捉", callback: () => new WikiCommandModal(this.app, this, "capture").open() });
    this.addCommand({ id: "xiaoyuanAI-wiki-ingest", name: "\u{1F4E5} Wiki 摄入", callback: () => new WikiCommandModal(this.app, this, "ingest").open() });

    this.addCommand({ id: "xiaoyuanAI-new-chat", name: "\u{1F4AC} 新建 AI 对话", callback: () => this.activateChatView() });
    this.addCommand({
      id: "xiaoyuanAI-chat-with-note", name: "\u{1F4C4} 用当前笔记开启 AI 对话",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) { new Notice("请先打开一个笔记"); return; }
        const content = await this.app.vault.read(file);
        const leaf = this.activateChatView();
        if (leaf?.view instanceof XiaoyuanAIChatView) {
          leaf.view.addMessage("user", `我有一段笔记内容，帮我分析：\n\n${content.slice(0, 3000)}`);
        }
      },
    });

    this.addSettingTab(new XiaoyuanAISettingTab(this.app, this));
  }

  activateChatView(): WorkspaceLeaf | undefined {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
    if (!leaf) {
      const useRight = this.settings.chatViewType === "right";
      leaf = useRight ? workspace.getRightLeaf(false) || undefined : workspace.getLeftLeaf(false) || undefined;
      if (leaf) leaf.setViewState({ type: VIEW_TYPE_XIAOYUAN_AI_CHAT, active: true });
    }
    if (leaf) workspace.revealLeaf(leaf);
    return leaf;
  }

  getActiveEditor() {
    return (this.app.workspace as any).activeEditor?.editor || null;
  }

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }

  async onunload() {
    await stopOpenCodeServer();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT);
  }
}
