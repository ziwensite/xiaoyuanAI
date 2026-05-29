import { ItemView, WorkspaceLeaf, Notice, setIcon, setTooltip } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import {
  ChatMessage,
  ChatSession,
  VIEW_TYPE_XIAOYUAN_AI_CHAT,
  FileDiff,
  Attachment,
  getActiveProvider,
} from "./types";
import type { ApiProviderConfig } from "./types";
import { renderMarkdown } from "./markdown";
import { callAIWithCLI, callAIWithAPI, getVaultBasePath, fetchOpenCodeModelsFromCLI, estimateTokens, clearCLISessionID, getCLISessionID, checkOpenCodeStatus, ensureOpenCodeServer } from "./ai";
import {
  getChatHistoryPath,
  ensureChatHistoryFolder,
  scanChatHistoryFolder,
  loadSessionFromFile,
  saveSessionToFile,
  deleteSessionFile,
  saveSessionsMeta,
  loadSessionsMeta,
  migrateOldData,
} from "./session";
import { showPopup, addPopupItem } from "./popup";
import { buildToolbarContent as toolbarBuildToolbarContent } from "./toolbar";

export class XiaoyuanAIChatView extends ItemView {
  plugin: XiaoyuanAIPlugin;
  messages: ChatMessage[] = [];
  sessions: ChatSession[] = [];
  currentSessionId = "";
  private msgIdCounter = 0;
  private viewContainer!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private inputEl!: HTMLTextAreaElement;
  private sendBtn!: HTMLSpanElement;
  private sessionSelector!: HTMLSpanElement;
  private toolbarEl!: HTMLDivElement;
  abortController: AbortController | null = null;
  private pendingDiffs: FileDiff[] | null = null;
  private connectionStatusEl: HTMLSpanElement | null = null;
  private attachments: Attachment[] = [];
  private attachPreviewEl!: HTMLDivElement;

  constructor(leaf: WorkspaceLeaf, plugin: XiaoyuanAIPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_XIAOYUAN_AI_CHAT; }
  getDisplayText(): string { return "小元AI"; }
  getIcon(): string { return "message-circle"; }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("xiaoyuan-chat-container");
    this.viewContainer = contentEl.createDiv({ cls: "xiaoyuan-chat" });
    this.buildHeader();
    this.messagesEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-messages" });
    this.buildInputArea();
    if (this.plugin.settings.execMode === "cli") {
      this.syncCLIModels();
    } else {
      this.checkConnectionStatus();
    }
    await this.loadSessions();
  }

  async onClose() {
    await this.saveCurrentSession();
    this.viewContainer.empty();
  }

  refresh() {
    this.messages = [];
    this.messagesEl.empty();
    this.addWelcomeMessage();
  }

  public async newChat() {
    clearCLISessionID();
    await this.saveCurrentSession();
    await this.createNewSession();
  }

  public addMessage(role: "user" | "assistant", content: string) {
    const id = "msg-" + (++this.msgIdCounter);
    this.messages.push({ id, role, content });
    this.messagesEl.appendChild(this.renderMessageEl(id, role, content, false));
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  public getActiveEditor() {
    return (this.app.workspace as any).activeEditor?.editor || null;
  }

  public rebuildToolbar() {
    if (!this.toolbarEl) return;
    this.toolbarEl.empty();
    this.buildToolbarContent(this.toolbarEl);
    this.updateAgentBorderClass();
    if (this.plugin.settings.execMode === "cli") {
      this.syncCLIModels();
    } else {
      this.checkConnectionStatus();
    }
  }

  // ─── Header ──────────────────────────────────────────────────────

  private buildHeader() {
    const headerEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-header" });
    const left = headerEl.createSpan({ cls: "xiaoyuan-chat-header-left" });
    const right = headerEl.createSpan({ cls: "xiaoyuan-chat-header-right" });

    const newChatBtn = left.createSpan({ cls: "xiaoyuan-new-chat-icon" });
    setIcon(newChatBtn, "message-square-plus");
    setTooltip(newChatBtn, "新建对话");
    newChatBtn.addEventListener("click", () => this.newChat());

    this.sessionSelector = left.createSpan({ cls: "xiaoyuan-session-selector" });
    setTooltip(this.sessionSelector, "点击选择会话");
    this.sessionSelector.textContent = "新对话";
    this.sessionSelector.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.showSessionDropdown(e);
    });

    this.buildHeaderContent(right);
  }

  private rebuildHeader() {
    const headerEl = this.viewContainer.querySelector(".xiaoyuan-chat-header");
    if (!headerEl) return;
    const right = headerEl.querySelector(".xiaoyuan-chat-header-right");
    if (!right) return;
    // remove status dot if exists
    const oldDot = right.querySelector(".xy-status-dot");
    if (oldDot) oldDot.remove();
    // remove old mode selector & settings icon (recreated by buildHeader)
    (right as HTMLSpanElement).empty();
    this.buildHeaderContent(right as HTMLSpanElement);
  }

  private buildHeaderContent(right: HTMLSpanElement) {
    const s = this.plugin.settings;
    this.connectionStatusEl = right.createSpan({ cls: "xy-status-dot" });
    this.updateConnectionStatusUI(false);
    this.connectionStatusEl.addEventListener("click", () => {
      if (s.execMode === "cli") {
        this.syncCLIModels();
      } else {
        this.checkConnectionStatus();
      }
    });

    const modeText = right.createSpan({ cls: "xiaoyuan-mode-selector" });
    modeText.textContent = s.execMode === "cli" ? "CLI" : "API";
    setTooltip(modeText, "点击切换执行模式");
    modeText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(modeText, (popup) => {
        addPopupItem(popup, "API", s.execMode === "api", () => {
          s.execMode = "api";
          this.plugin.saveSettings();
          this.rebuildHeader();
          this.rebuildToolbar();
          this.addSystemMessage("✅ 已切换到 API 模式");
          new Notice("已切换到 API 模式");
        });
        addPopupItem(popup, "CLI", s.execMode === "cli", () => {
          s.execMode = "cli";
          this.plugin.saveSettings();
          this.rebuildHeader();
          this.rebuildToolbar();
          this.addSystemMessage("✅ 已切换到 CLI 模式");
          new Notice("已切换到 CLI 模式");
        });
      });
    });
    right.appendChild(modeText);

    const settingsIcon = right.createSpan({ cls: "xiaoyuan-settings-icon" });
    setIcon(settingsIcon, "settings");
    setTooltip(settingsIcon, "设置");
    settingsIcon.addEventListener("click", () => {
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById("xiaoyuanAI");
    });
  }

  // ─── Input ───────────────────────────────────────────────────────

  private buildInputArea() {
    const container = this.viewContainer.createDiv({ cls: "xiaoyuan-input-container" });
    this.inputEl = container.createEl("textarea", {
      cls: "xiaoyuan-chat-input",
      attr: { placeholder: "输入你的问题..." },
    });

    this.attachPreviewEl = container.createDiv({ cls: "xiaoyuan-attach-preview" });

    this.toolbarEl = container.createDiv({ cls: "xiaoyuan-toolbar" });
    this.buildToolbarContent(this.toolbarEl);

    this.updateAgentBorderClass();

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });
  }

  private updateAgentBorderClass() {
    const agent = this.plugin.settings.opencode.agent;
    this.viewContainer.removeClass("xy-agent-plan", "xy-agent-build");
    if (agent === "plan") this.viewContainer.addClass("xy-agent-plan");
    else if (agent === "build") this.viewContainer.addClass("xy-agent-build");
  }

  private buildToolbarContent(container: HTMLElement) {
    this.sendBtn = toolbarBuildToolbarContent(container, this);
    this.setProcessingState(false);
  }

  async syncCLIModels() {
    const s = this.plugin.settings;
    try {
      if (s.opencode.autoStart) {
        await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath(this.app.vault), true).catch(() => {});
      }
      const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, getVaultBasePath(this.app.vault), s.opencode.port);
      s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
      s.opencodeModelCaps = result.caps;
      if (result.defaultModel && !s.opencode.model) {
        s.opencode.model = result.defaultModel;
      }
      if (!s.opencode.model && result.models.length > 0) {
        s.opencode.model = result.models[0].id;
      }
      if (s.opencode.model && result.models.length > 0 && !result.models.some(m => m.id === s.opencode.model)) {
        s.opencode.model = result.defaultModel || result.models[0].id;
      }
      await this.plugin.saveSettings();
      if (result.models.length === 0) {
        new Notice("未找到模型，请检查 opencode 配置");
      } else {
        new Notice(`已同步 ${result.models.length} 个模型`);
      }
      this.updateConnectionStatusUI(true);
    } catch (err: any) {
      this.updateConnectionStatusUI(false);
      new Notice(`同步模型失败：${err.message}`);
    }
  }

  private async checkConnectionStatus() {
    const s = this.plugin.settings;

    if (s.execMode === "cli") {
      const vaultDir = getVaultBasePath(this.app.vault);
      let ok = false;
      const status = await checkOpenCodeStatus(s.opencode.cliPath, vaultDir, s.opencode.port, s.opencode.hostname);
      if (status.ok) {
        ok = true;
      } else if (s.opencode.autoStart) {
        try {
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
          ok = true;
        } catch {}
      }
      this.updateConnectionStatusUI(ok);
      return;
    }

    const provider = getActiveProvider(s);
    if (!provider || !provider.baseUrl || !provider.apiKey) {
      this.updateConnectionStatusUI(false);
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
      const resp = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${provider.apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      this.updateConnectionStatusUI(resp.ok);
    } catch {
      this.updateConnectionStatusUI(false);
    }
  }

  private updateConnectionStatusUI(ok: boolean) {
    if (!this.connectionStatusEl) return;
    const mode = this.plugin.settings.execMode;
    this.connectionStatusEl.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;cursor:pointer;background:${ok ? "var(--color-green)" : "var(--color-red)"};`;
    const tip = mode === "cli"
      ? (ok ? "opencode 可用" : "opencode 不可用")
      : (ok ? "API 连接正常" : "API 未连接");
    setTooltip(this.connectionStatusEl, tip);
  }

  // ─── Message rendering ───────────────────────────────────────────

  private renderMessageEl(
    id: string, role: "user" | "assistant", content: string,
    streaming = false, thinking?: string,
  ): HTMLDivElement {
    const msgEl = createDiv({ cls: `xiaoyuan-msg xiaoyuan-msg-${role}` });
    msgEl.id = id;

    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });

    if (role === "user") {
      bubbleEl.createSpan().textContent = content;
      if (!streaming) {
        const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
        const undoBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        undoBtn.textContent = "\u21A9";
        setTooltip(undoBtn, "撤销此消息");
        undoBtn.addEventListener("click", () => {
          if (window.confirm("确认撤销此消息？")) this.undoMessage(id);
        });
        const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        copyBtn.textContent = "\uD83D\uDCCB";
        setTooltip(copyBtn, "复制");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(content);
          new Notice("已复制");
        });
      }
    } else {
      const s = this.plugin.settings;
      if (thinking && s.showThinking) {
        const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
        detailsEl.createEl("summary", { text: "\u{1F914} 思考过程" });
        const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
        tc.innerHTML = renderMarkdown(thinking.trim());
      }
      bubbleEl.insertAdjacentHTML("beforeend", renderMarkdown(content.trim()));
      if (!streaming) {
        const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
        const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        copyBtn.textContent = "\uD83D\uDCCB";
        setTooltip(copyBtn, "复制");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(content);
          new Notice("已复制");
        });
      }
      setTimeout(() => {
        if (!bubbleEl.isConnected) return;
        (window as Record<string, any>).Prism?.highlightAllUnder(bubbleEl);
        bubbleEl.querySelectorAll("pre").forEach((pre) => {
          if (pre.querySelector(".xy-copy-btn")) return;
          const btn = document.createElement("button");
          btn.className = "xy-copy-btn";
          btn.textContent = "复制";
          pre.style.position = "relative";
          btn.addEventListener("click", () => {
            navigator.clipboard.writeText(pre.textContent || "");
            btn.textContent = "已复制";
            setTimeout(() => { btn.textContent = "复制"; }, 2000);
          });
          pre.appendChild(btn);
        });
      }, 0);
    }

    return msgEl;
  }

  private addWelcomeMessage() {
    const s = this.plugin.settings;
    const modeInfo = s.execMode === "cli"
      ? "当前模式：CLI（opencode run）"
      : "当前模式：API（直接调用）";

    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant xiaoyuan-welcome" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).innerHTML =
      `\uD83D\uDC4B 你好！我是小元。<br><br>${modeInfo}<br><br>我可以帮你：<br>\u2022 \uD83D\uDCAC 聊天对话<br>\u2022 \u270D\uFE0F 润色、总结、补全笔记<br>\u2022 \uD83D\uDD0D 查询维基知识<br><br>选中文本后右键 \u2192 使用 AI 操作。`;
  }

  private addSystemMessage(text: string): HTMLDivElement {
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-system" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).textContent = text;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return msgEl;
  }

  private truncateMessagesIfNeeded(): void {
    const s = this.plugin.settings;
    const threshold = Math.floor(s.maxTokens * 0.75);
    const sysTokens = estimateTokens(s.systemPrompt);
    const msgTokens = estimateTokens(this.messages.map((m) => m.content).join("\n"));
    if (sysTokens + msgTokens <= threshold) return;

    let removed = 0;
    while (this.messages.length > 0) {
      const remaining = this.messages.slice(removed).map((m) => m.content).join("\n");
      if (estimateTokens(remaining) + sysTokens <= threshold) break;
      removed++;
    }
    if (removed === 0) return;

    const kept = this.messages.slice(removed);
    this.messages = kept;
    this.messagesEl.empty();
    this.addWelcomeMessage();
    for (const m of kept) {
      this.messagesEl.appendChild(this.renderMessageEl(m.id, m.role, m.content, false));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.addSystemMessage(`已自动截断 ${removed} 条历史消息以控制 Token 用量`);
  }

  // ─── Send / AI ───────────────────────────────────────────────────

  async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.addMessage("user", text);
    this.updateSessionTitle();
    this.inputEl.value = "";
    this.abortController = new AbortController();
    this.pendingDiffs = null;
    this.setProcessingState(true);
    this.truncateMessagesIfNeeded();

    let statusMsg: HTMLDivElement | null = null;
    if (this.plugin.settings.execMode === "cli") {
      statusMsg = this.addSystemMessage("正在连接 opencode...");
    }

    try {
      const response = await this.callAI(text, this.abortController.signal, statusMsg);
      this.attachments = [];
      this.renderAttachments();
      if (statusMsg) statusMsg.remove();
      if (this.plugin.settings.execMode === "cli") {
        const streamId = this.finalizeStreamingMessage();
        await this.saveCurrentSession();
        const actualDiffs = this.pendingDiffs as FileDiff[] | null;
        if (this.plugin.settings.showDiffPreview && streamId && actualDiffs?.length) {
          const diffs = actualDiffs;
          this.renderDiffs(streamId, diffs);
          await this.saveCurrentSession();
        }
      }
    } catch (err: any) {
      if (statusMsg) statusMsg.remove();
      if (err.name === "AbortError") {
        clearCLISessionID();
        this.addSystemMessage("\u23F9 已中断");
      } else {
        this.addMessage("assistant", `\u274C 错误：${err.message}`);
      }
      await this.saveCurrentSession();
    } finally {
      this.abortController = null;
      this.pendingDiffs = null;
      this.setProcessingState(false);
      this.inputEl.focus();
    }
  }

  private async callAI(
    userMessage: string, signal?: AbortSignal,
    statusMsg?: HTMLDivElement | null,
  ): Promise<string> {
    const s = this.plugin.settings;

    let enrichedMessage = userMessage;
    if (this.attachments.length > 0) {
      const attachBlocks = await Promise.all(this.attachments.map(async (att) => {
        if (att.type.startsWith("image/")) {
          return `![${att.name}](${att.data})`;
        }
        return `[附件: ${att.name}]\n\`\`\`\n${att.data}\n\`\`\``;
      }));
      enrichedMessage = attachBlocks.join("\n\n") + "\n\n" + userMessage;
    }

    if (s.execMode === "cli") {
      const vaultDir = getVaultBasePath(this.app.vault);
      if (s.opencode.autoStart) {
        try {
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
        } catch (err: any) {
          new Notice(`⚠ 启动 opencode 失败: ${err.message}`);
          throw new Error(`无法启动 opencode serve: ${err.message}`);
        }
      }
      if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === "user") {
        this.messages[this.messages.length - 1].content = enrichedMessage;
      }
      const allMessages = [
        { role: "system" as const, content: s.systemPrompt },
        ...this.messages.map((m) => ({ role: m.role, content: m.content })),
      ];
      const prompt = allMessages
        .map((m) => `${m.role === "system" ? "[系统]" : m.role === "user" ? "[用户]" : "[助手]"}: ${m.content}`)
        .join("\n\n");

      let streamingId = "";
      let thinkingText = "";
      return callAIWithCLI(
        prompt, s, vaultDir, undefined, signal,
        () => {
          if (statusMsg) {
            const bubble = statusMsg.querySelector(".xiaoyuan-msg-bubble");
            if (bubble) bubble.textContent = "已连接，等待响应...";
          }
        },
        (text) => {
          thinkingText = text;
          if (streamingId) this.updateStreamingThinking(streamingId, text);
        },
        (text) => {
          if (statusMsg) { statusMsg.remove(); statusMsg = null; }
          if (!streamingId) {
            streamingId = this.addStreamingMessage(text, thinkingText);
          } else {
            this.updateStreamingMessage(streamingId, text);
          }
        },
        (diffs) => { this.pendingDiffs = diffs; },
        (tool, status) => {
          if (streamingId) this.addToolLogEntry(streamingId, tool, status);
        },
      );
    }

    const provider = getActiveProvider(s);
    if (!provider || !provider.apiKey) throw new Error("API Key 未配置。请在设置中填写。");

    const apiUrl = provider.baseUrl.includes("/chat/completions") ? provider.baseUrl : provider.baseUrl + "/chat/completions";

    const resp = await callAIWithAPI(apiUrl, provider.apiKey, provider.model, [
      { role: "system", content: s.systemPrompt },
      ...this.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: enrichedMessage },
    ], s.maxTokens, s.temperature, true, signal, s.apiReasoningEffort);

    return this.processStreamResponse(resp);
  }

  private async processStreamResponse(resp: Response): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = resp.body?.getReader();
      if (!reader) { reject(new Error("无法读取响应流")); return; }

      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let messageId = "";
      let closed = false;

      const finish = (err?: Error) => {
        if (closed) return;
        closed = true;
        try { reader.releaseLock(); } catch {}
        if (err) reject(err);
        else resolve(fullContent || "（无响应）");
      };

      const readChunk = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) { finish(); return; }

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
            const dataStr = trimmedLine.slice(5).trim();
            if (dataStr === "[DONE]") { finish(); return; }
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                if (!messageId) {
                  messageId = this.addStreamingMessage(fullContent);
                } else {
                  this.updateStreamingMessage(messageId, fullContent);
                }
              }
            } catch {}
          }
          readChunk();
        } catch (err) {
          finish(err instanceof Error ? err : new Error("流式响应处理失败"));
        }
      };

      readChunk();
    });
  }

  private addStreamingMessage(content: string, thinking?: string): string {
    const id = "msg-" + (++this.msgIdCounter);
    this.messages.push({ id, role: "assistant", content, thinking });
    const msgEl = createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant" });
    msgEl.id = id;
    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });
    if (thinking && this.plugin.settings.showThinking) {
      const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
      detailsEl.createEl("summary", { text: "\u{1F914} 思考过程" });
      const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.textContent = thinking;
    }
    const contentEl = bubbleEl.createDiv({ cls: "xy-stream-content" });
    contentEl.textContent = content;
    this.messagesEl.appendChild(msgEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return id;
  }

  private updateStreamingMessage(messageId: string, content: string) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    const contentEl = msgEl.querySelector(".xy-stream-content") as HTMLElement;
    if (contentEl) contentEl.textContent = content;
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].content = content;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private updateStreamingThinking(messageId: string, thinking: string) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl || !this.plugin.settings.showThinking) return;
    let tc = msgEl.querySelector(".xiaoyuan-thinking-content") as HTMLElement;
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].thinking = thinking;
    if (tc) {
      tc.textContent = thinking;
    } else {
      const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
      if (!bubbleEl) return;
      const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
      detailsEl.createEl("summary", { text: "\u{1F914} 思考过程" });
      tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.textContent = thinking;
    }
  }

  private addToolLogEntry(messageId: string, toolName: string, status: string) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    let logEl = msgEl.querySelector(".xy-tool-log") as HTMLElement;
    if (!logEl) {
      const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
      if (!bubbleEl) return;
      logEl = bubbleEl.createDiv({ cls: "xy-tool-log" });
    }
    const toolLabel = toolName === "bash" ? "执行命令" : toolName === "write" ? "写入文件" : toolName === "edit" ? "编辑文件" : toolName === "read" ? "读取文件" : toolName;
    const icon = status === "running" ? "\u{23F3}" : "\u{2705}";
    let entry = logEl.querySelector(`[data-tool="${toolName}"]`) as HTMLElement;
    if (!entry) {
      entry = logEl.createDiv({ cls: "xy-tool-entry" });
      entry.setAttribute("data-tool", toolName);
    }
    entry.textContent = `${icon} ${toolLabel}`;
  }

  private finalizeStreamingMessage(): string | null {
    const lastMsg = this.messages[this.messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return null;
    const msgEl = this.messagesEl.querySelector(`#${lastMsg.id}`);
    if (!msgEl) return null;
    msgEl.remove();
    const newEl = this.renderMessageEl(lastMsg.id, lastMsg.role, lastMsg.content, false, lastMsg.thinking);
    this.messagesEl.appendChild(newEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return lastMsg.id;
  }

  private renderDiffs(messageId: string, diffs: FileDiff[]) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    const existing = msgEl.querySelector(".xiaoyuan-diffs");
    if (existing) existing.remove();

    const diffsEl = msgEl.createDiv({ cls: "xiaoyuan-diffs" });
    const toggle = diffsEl.createEl("details");
    const summary = toggle.createEl("summary", { cls: "xiaoyuan-diffs-summary" });
    const totalAdd = diffs.reduce((s, d) => s + d.additions, 0);
    const totalDel = diffs.reduce((s, d) => s + d.deletions, 0);
    summary.textContent = `\u{1F4CB} 文件变更（+${totalAdd}/-${totalDel}，${diffs.length} 个文件）`;

    for (const diff of diffs) {
      const fileEl = toggle.createDiv({ cls: "xiaoyuan-diff-file" });
      const headerEl = fileEl.createDiv({ cls: "xiaoyuan-diff-file-header" });
      headerEl.textContent = `${diff.file} (+${diff.additions}/-${diff.deletions})`;
      const contentEl = fileEl.createDiv({ cls: "xiaoyuan-diff-content" });

      const beforeLines = diff.before.split("\n");
      const afterLines = diff.after.split("\n");
      const maxLen = Math.max(beforeLines.length, afterLines.length);

      const table = contentEl.createEl("table", { cls: "xiaoyuan-diff-table" });
      for (let i = 0; i < maxLen; i++) {
        const row = table.createEl("tr");
        row.createEl("td", { text: String(i + 1) });
        row.createEl("td", { text: String(i + 1) });

        const b = beforeLines[i] ?? "";
        const a = afterLines[i] ?? "";
        if (b === a) {
          row.classList.add("diff-context");
          row.createEl("td", { text: b });
        } else if (b && !a) {
          row.classList.add("diff-removed");
          row.createEl("td", { text: b });
        } else if (!b && a) {
          row.classList.add("diff-added");
          row.createEl("td", { text: a });
        } else {
          row.classList.add("diff-changed");
          const cell = row.createEl("td");
          cell.createEl("span", { text: b, cls: "diff-removed" });
          cell.createEl("br");
          cell.createEl("span", { text: a, cls: "diff-added" });
        }
      }
    }
  }

  // ─── Session management ──────────────────────────────────────────

  private async loadSessions() {
    try {
      const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
      await ensureChatHistoryFolder(this.app.vault, path);

      const meta = await loadSessionsMeta(this.plugin);
      this.sessions = await scanChatHistoryFolder(this.app.vault, path);
      this.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      this.currentSessionId = meta.currentSessionId;

      if (this.sessions.length === 0) {
        const oldMessages = migrateOldData(meta as any);
        if (oldMessages && oldMessages.length > 0) {
          const newSession: ChatSession = {
            id: "session-" + Date.now(),
            title: oldMessages[0]?.content?.slice(0, 30) || "历史对话",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          this.sessions.push(newSession);
          this.messages = [...oldMessages];
          await saveSessionToFile(this.app.vault, path, newSession.id, newSession, oldMessages);
        }
      }
    } catch (e) {
      console.warn("加载会话失败:", e);
    }

    if (this.sessions.length === 0) {
      await this.createNewSession();
    } else {
      const target = this.sessions.find((s) => s.id === this.currentSessionId) || this.sessions[0];
      this.currentSessionId = target.id;
      await this.loadSession(target);
      await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
    }
    this.updateSessionSelector();
  }

  private async loadSession(session: ChatSession) {
    const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    this.messages = await loadSessionFromFile(this.app.vault, path, session.id);
    this.msgIdCounter = this.messages.length;
    this.messagesEl.empty();

    if (this.messages.length === 0) {
      this.addWelcomeMessage();
      return;
    }

    for (const msg of this.messages) {
      this.messagesEl.appendChild(this.renderMessageEl(msg.id, msg.role, msg.content, false));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private sessionTitleFromMessages(): string {
    const firstUser = this.messages.find(m => m.role === "user");
    const text = firstUser?.content || this.messages[0]?.content || "新对话";
    const cleaned = text.replace(/^#+\s*/, "").replace(/[*_`~]/g, "").trim();
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "…" : cleaned;
  }

  private async saveCurrentSession() {
    if (this.messages.length === 0) return;
    const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session) {
      session.updatedAt = Date.now();
      if (session.title === "新对话" || session.title === "") {
        session.title = this.sessionTitleFromMessages();
        this.updateSessionSelector();
      }
    }
    await saveSessionToFile(this.app.vault, path, this.currentSessionId, session, this.messages);
    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
  }

  private updateSessionTitle() {
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session && (session.title === "新对话" || session.title === "") && this.messages.length > 0) {
      session.title = this.sessionTitleFromMessages();
      session.updatedAt = Date.now();
      this.updateSessionSelector();
    }
  }

  private async createNewSession() {
    const newSession: ChatSession = {
      id: "session-" + Date.now(),
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.unshift(newSession);
    this.currentSessionId = newSession.id;
    this.messages = [];
    this.msgIdCounter = 0;
    this.messagesEl.empty();
    this.addWelcomeMessage();
    this.updateSessionSelector();
  }

  private async switchSession(sessionId: string) {
    await this.saveCurrentSession();
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      this.currentSessionId = sessionId;
      await this.loadSession(session);
      this.updateSessionSelector();
      await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
      this.addSystemMessage(`已切换到会话: ${session.title}`);
    }
  }

  private async deleteSession(sessionId: string) {
    if (this.sessions.length <= 1) {
      new Notice("至少保留一个对话");
      return;
    }

    const idx = this.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;

    this.sessions.splice(idx, 1);
    await deleteSessionFile(this.app.vault, getChatHistoryPath(this.plugin.settings.chatHistoryPath), sessionId);

    if (this.currentSessionId === sessionId) {
      const next = this.sessions[0];
      this.currentSessionId = next.id;
      await this.loadSession(next);
    }

    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
    this.updateSessionSelector();
    new Notice("已删除");
  }

  private async showSessionDropdown(e: MouseEvent) {
    if (document.querySelector(".xy-popup")) {
      document.querySelectorAll(".xy-popup").forEach((el) => el.remove());
      return;
    }
    await this.saveCurrentSession();

    const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const diskSessions = await scanChatHistoryFolder(this.app.vault, path);
    const diskIds = new Set(diskSessions.map((s) => s.id));
    const unsaved = this.sessions.filter((s) => !diskIds.has(s.id));
    this.sessions = [...diskSessions, ...unsaved];

    if (!this.sessions.find((s) => s.id === this.currentSessionId)) {
      if (this.sessions.length > 0) {
        this.currentSessionId = this.sessions[0].id;
        await this.loadSession(this.sessions[0]);
      } else {
        await this.createNewSession();
      }
      this.updateSessionSelector();
    }
    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);

    showPopup(e.target as HTMLElement, (popup) => {
      const searchInput = popup.createEl("input", { cls: "xy-popup-search", type: "text", placeholder: "搜索会话..." });
      const listEl = popup.createDiv({ cls: "xy-popup-session-list" });

      for (const session of this.sessions) {
        const item = listEl.createDiv({ cls: "xy-popup-item" });

        const checkEl = item.createSpan({ cls: "xy-popup-check" });
        checkEl.textContent = session.id === this.currentSessionId ? "✓" : "";

        const titleEl = item.createSpan({ cls: "xy-popup-label" });
        titleEl.textContent = session.title;

        const startRename = (ev: Event) => {
          ev.stopPropagation();
          const input = document.createElement("input");
          input.type = "text";
          input.value = session.title;
          input.style.cssText = "flex:1;min-width:0;padding:2px 4px;font-size:inherit;background:transparent;border:1px solid var(--background-modifier-border);border-radius:4px;color:var(--text-normal);";
          const finish = (save: boolean) => {
            if (save) {
              const newTitle = input.value.trim() || session.title;
              if (newTitle !== session.title) {
                session.title = newTitle;
                this.updateSessionSelector();
                saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
              }
            }
            const span = createSpan({ cls: "xy-popup-label" });
            span.textContent = session.title;
            input.replaceWith(span);
          };
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); finish(true); }
            else if (e.key === "Escape") { finish(false); }
          });
          input.addEventListener("blur", () => finish(true));
          input.addEventListener("click", (e) => e.stopPropagation());
          titleEl.replaceWith(input);
          input.focus();
          input.select();
        };

        const suffix = item.createSpan({ cls: "xy-popup-suffix" });
        const renameBtn = suffix.createSpan({ cls: "xy-popup-suffix-btn" });
        renameBtn.textContent = "\u270E";
        renameBtn.style.fontSize = "12px";
        setTooltip(renameBtn, "重命名");
        renameBtn.addEventListener("click", startRename);

        const deleteBtn = suffix.createSpan({ cls: "xy-popup-suffix-btn" });
        deleteBtn.classList.add("danger");
        deleteBtn.textContent = "\u00D7";
        deleteBtn.style.fontSize = "16px";
        setTooltip(deleteBtn, "删除此对话");
        deleteBtn.addEventListener("click", (ev) => { ev.stopPropagation(); this.deleteSession(session.id); popup.remove(); });

        item.addEventListener("click", () => { this.switchSession(session.id); popup.remove(); });
      }

      searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase();
        Array.from(listEl.children).forEach((child) => {
          const el = child as HTMLElement;
          const label = el.querySelector(".xy-popup-label");
          const match = !q || (label?.textContent || "").toLowerCase().includes(q);
          el.style.display = match ? "" : "none";
        });
      });

      setTimeout(() => searchInput.focus(), 50);
    }, { maxHeight: "300px" });
  }

  private updateSessionSelector() {
    const current = this.sessions.find((s) => s.id === this.currentSessionId);
    if (current && this.sessionSelector) {
      this.sessionSelector.textContent = current.title;
    }
  }

  private undoMessage(id: string) {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const content = this.messages[idx].content;
    this.messages = this.messages.slice(0, idx);
    const msgEls = this.messagesEl.querySelectorAll(".xiaoyuan-msg");
    for (let i = msgEls.length - 1; i >= idx; i--) msgEls[i].remove();
    this.inputEl.value = content;
    this.inputEl.focus();
    this.saveCurrentSession();
  }

  // ─── Attachments ───────────────────────────────────────────────

  pickFiles() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.txt,.md,.csv,.json,.yaml,.yml,.xml";
    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      for (const file of files) {
        try {
          const data = await this.readFileAsBase64(file);
          this.attachments.push({ name: file.name, type: file.type || "application/octet-stream", data, size: file.size });
        } catch {}
      }
      this.renderAttachments();
    });
    input.click();
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private renderAttachments() {
    this.attachPreviewEl.empty();
    if (this.attachments.length === 0) {
      this.attachPreviewEl.style.display = "none";
      return;
    }
    this.attachPreviewEl.style.display = "flex";
    for (let i = 0; i < this.attachments.length; i++) {
      const att = this.attachments[i];
      const chip = this.attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
      chip.textContent = att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name;
      const removeBtn = chip.createSpan({ text: " ×" });
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", () => {
        this.attachments.splice(i, 1);
        this.renderAttachments();
      });
    }
  }

  // ─── Popup helpers ───────────────────────────────────────────────

  // ─── UI helpers ──────────────────────────────────────────────────

  private setProcessingState(processing: boolean) {
    if (processing) {
      setIcon(this.sendBtn, "circle-stop");
      setTooltip(this.sendBtn, "停止");
      this.sendBtn.style.color = "var(--color-red)";
    } else {
      setIcon(this.sendBtn, "circle-arrow-right");
      setTooltip(this.sendBtn, "发送");
      this.sendBtn.style.color = "";
    }
    this.inputEl.disabled = processing;
  }
}

// ─── Exported popup helpers ───────────────────────────────────────


