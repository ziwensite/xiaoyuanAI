import { ItemView, WorkspaceLeaf, Notice, setIcon } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import {
  ChatMessage,
  ChatSession,
  VIEW_TYPE_XIAOYUAN_AI_CHAT,
} from "./types";
import { renderMarkdown } from "./markdown";
import { callAIWithCLI, callAIWithAPI, getVaultBasePath } from "./ai";
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
    this.buildHeader();
    this.messagesEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-messages" });
    this.buildInputArea();
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

  // ─── Header ──────────────────────────────────────────────────────

  private buildHeader() {
    const headerEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-header" });
    const left = headerEl.createSpan({ cls: "xiaoyuan-chat-header-left" });
    const right = headerEl.createSpan({ cls: "xiaoyuan-chat-header-right" });

    const newChatBtn = left.createSpan({ cls: "xiaoyuan-new-chat-icon", title: "新建对话" });
    setIcon(newChatBtn, "message-square-plus");
    newChatBtn.addEventListener("click", () => this.newChat());

    this.sessionSelector = left.createSpan({ cls: "xiaoyuan-session-selector", title: "点击选择会话" });
    this.sessionSelector.textContent = "新对话";
    this.sessionSelector.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.showSessionDropdown(e);
    });

    const modeText = this.createSelector(
      "xiaoyuan-mode-selector",
      [
        { value: "api", label: "API" },
        { value: "hybrid", label: "混合" },
        { value: "cli", label: "CLI" },
      ],
      this.plugin.settings.execMode,
      "点击切换执行模式",
      (value) => {
        this.plugin.settings.execMode = value as "api" | "cli" | "hybrid";
        this.plugin.saveSettings();
        this.refresh();
      },
    );
    right.appendChild(modeText);

    const settingsIcon = right.createSpan({ cls: "xiaoyuan-settings-icon", title: "设置" });
    setIcon(settingsIcon, "settings");
    settingsIcon.addEventListener("click", () => {
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById("xiaoyuanAI");
    });
  }

  // ─── Input ───────────────────────────────────────────────────────

  private buildInputArea() {
    this.inputEl = this.viewContainer.createDiv({ cls: "xiaoyuan-input-container" }).createEl("textarea", {
      cls: "xiaoyuan-chat-input",
      attr: { placeholder: "输入你的问题..." },
    });

    const toolbarEl = this.inputEl.parentElement!.createDiv({ cls: "xiaoyuan-toolbar" });

    const attachBtn = toolbarEl.createSpan({ cls: "xiaoyuan-attach-btn", title: "添加附件" });
    setIcon(attachBtn, "paperclip");

    const buildModeText = this.createSelector(
      "xiaoyuan-build-mode-select",
      [{ value: "plan", label: "plan" }, { value: "build", label: "build" }],
      this.plugin.settings.buildMode,
      "点击切换构建模式",
      (value) => { this.plugin.settings.buildMode = value as "plan" | "build"; this.plugin.saveSettings(); },
      true,
    );
    toolbarEl.appendChild(buildModeText);

    const models = [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
      { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus", label: "Claude 3 Opus" },
      { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
      { value: "claude-3-haiku", label: "Claude 3 Haiku" },
      { value: "custom", label: "自定义模型..." },
    ];
    const modelText = this.createSelector(
      "xiaoyuan-model-select",
      models,
      this.plugin.settings.model,
      "点击切换模型",
      (value) => {
        if (value === "custom") {
          const customModel = prompt("请输入自定义模型名称：", this.plugin.settings.model);
          if (customModel?.trim()) {
            this.plugin.settings.model = customModel.trim();
            this.plugin.saveSettings();
            modelText.textContent = customModel.trim();
          }
        } else {
          this.plugin.settings.model = value;
          this.plugin.saveSettings();
        }
      },
      true,
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
      (value) => { this.plugin.settings.level = value as "low" | "medium" | "high" | "max"; this.plugin.saveSettings(); },
      true,
    );
    toolbarEl.appendChild(levelText);

    this.sendBtn = toolbarEl.createSpan({ cls: "xiaoyuan-attach-btn", title: "发送" });
    this.sendBtn.style.marginLeft = "auto";
    setIcon(this.sendBtn, "send");
    this.sendBtn.addEventListener("click", () => this.sendMessage());

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });
  }

  // ─── Message rendering ───────────────────────────────────────────

  private renderMessageEl(id: string, role: "user" | "assistant", content: string, streaming = false): HTMLDivElement {
    const msgEl = createDiv({ cls: `xiaoyuan-msg xiaoyuan-msg-${role}` });
    msgEl.id = id;

    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });

    if (role === "user") {
      bubbleEl.createSpan().textContent = content;
      if (!streaming) {
        const undoBtn = msgEl.createSpan({ cls: "xiaoyuan-msg-action xiaoyuan-undo-btn" });
        undoBtn.textContent = "\u21A9";
        undoBtn.title = "撤销此消息";
        undoBtn.addEventListener("click", () => this.undoMessage(id));
      }
    } else {
      bubbleEl.innerHTML = renderMarkdown(content.trim());
      if (!streaming) {
        const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
        const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        copyBtn.textContent = "\uD83D\uDCCB";
        copyBtn.title = "复制";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(content);
          new Notice("已复制");
        });
      }
    }

    return msgEl;
  }

  private addWelcomeMessage() {
    const s = this.plugin.settings;
    const modeInfo = s.execMode === "cli"
      ? "当前模式：CLI（opencode serve）"
      : s.execMode === "hybrid"
        ? "当前模式：混合（操作\u2192CLI, 聊天\u2192API）"
        : "当前模式：API（直接调用）";

    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant xiaoyuan-welcome" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).innerHTML =
      `\uD83D\uDC4B 你好！我是小元。<br><br>${modeInfo}<br><br>我可以帮你：<br>\u2022 \uD83D\uDCAC 聊天对话<br>\u2022 \u270D\uFE0F 润色、总结、补全笔记<br>\u2022 \uD83D\uDD0D 查询维基知识<br><br>选中文本后右键 \u2192 使用 AI 操作。`;
  }

  private addSystemMessage(text: string) {
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-system" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).textContent = text;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  // ─── Send / AI ───────────────────────────────────────────────────

  private async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.addMessage("user", text);
    this.updateSessionTitle();
    this.inputEl.value = "";
    this.setInputDisabled(true);
    try {
      await this.callAI(text);
    } catch (err: any) {
      this.addMessage("assistant", `\u274C 错误：${err.message}`);
      await this.saveCurrentSession();
    } finally {
      this.setInputDisabled(false);
      this.inputEl.focus();
    }
  }

  private async callAI(userMessage: string): Promise<string> {
    const s = this.plugin.settings;

    if (s.execMode === "cli") {
      const vaultDir = getVaultBasePath(this.app.vault);
      const allMessages = [
        { role: "system" as const, content: s.systemPrompt },
        ...this.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ];
      const prompt = allMessages
        .map((m) => `${m.role === "system" ? "[系统]" : m.role === "user" ? "[用户]" : "[助手]"}: ${m.content}`)
        .join("\n\n");
      return callAIWithCLI(prompt, s, vaultDir);
    }

    if (!s.apiKey) throw new Error("API Key 未配置。请在设置中填写。");

    const resp = await callAIWithAPI(s.apiEndpoint, s.apiKey, s.model, [
      { role: "system", content: s.systemPrompt },
      ...this.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ], s.maxTokens, s.temperature, true);

    return this.processStreamResponse(resp);
  }

  private async processStreamResponse(resp: Response): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = resp.body?.getReader();
      if (!reader) { reject(new Error("无法读取响应流")); return; }

      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let messageId = "";

      const readChunk = async () => {
        try {
          const { done, value } = await reader.read();

          if (done) {
            await this.saveCurrentSession();
            this.updateSessionTitle();
            resolve(fullContent || "（无响应）");
            return;
          }

          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

            const dataStr = trimmedLine.slice(5).trim();
            if (dataStr === "[DONE]") {
              reader.releaseLock();
              await this.saveCurrentSession();
              this.updateSessionTitle();
              resolve(fullContent || "（无响应）");
              return;
            }

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
            } catch (e) {
              console.warn("解析流式数据失败:", e);
            }
          }

          readChunk();
        } catch (err) {
          reader.releaseLock();
          reject(err instanceof Error ? err : new Error("流式响应处理失败"));
        }
      };

      readChunk();
    });
  }

  private addStreamingMessage(content: string): string {
    const id = "msg-" + (++this.msgIdCounter);
    this.messages.push({ id, role: "assistant", content });
    this.messagesEl.appendChild(this.renderMessageEl(id, "assistant", content, true));
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return id;
  }

  private updateStreamingMessage(messageId: string, content: string) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
    if (bubbleEl) bubbleEl.innerHTML = renderMarkdown(content.trim());

    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].content = content;

    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  // ─── Session management ──────────────────────────────────────────

  private async loadSessions() {
    try {
      const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
      await ensureChatHistoryFolder(this.app.vault, path);

      const meta = await loadSessionsMeta(this.plugin);
      this.sessions = await scanChatHistoryFolder(this.app.vault, path);
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

  private async saveCurrentSession() {
    if (this.messages.length === 0) return;
    const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session) {
      session.updatedAt = Date.now();
      if (session.title === "新对话") {
        session.title = this.messages[0].content.slice(0, 30) + (this.messages[0].content.length > 30 ? "..." : "");
      }
    }
    await saveSessionToFile(this.app.vault, path, this.currentSessionId, session, this.messages);
    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
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
    document.querySelectorAll(".xiaoyuan-session-dropdown").forEach((el) => el.remove());
    await this.saveCurrentSession();

    const path = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    this.sessions = await scanChatHistoryFolder(this.app.vault, path);

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

    const dropdown = document.body.createDiv({ cls: "xiaoyuan-session-dropdown" });
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dropdown.style.cssText = `position:fixed;top:${rect.bottom}px;left:${rect.left}px;max-height:300px;overflow-y:auto;`;

    for (const session of this.sessions) {
      const item = dropdown.createDiv({ cls: "xiaoyuan-session-dropdown-item" });
      if (session.id === this.currentSessionId) item.classList.add("active");

      const titleEl = item.createSpan({ cls: "xiaoyuan-session-dropdown-title" });
      titleEl.textContent = session.title;

      const deleteBtn = item.createSpan({ cls: "xiaoyuan-session-dropdown-delete" });
      deleteBtn.textContent = "\u00D7";
      deleteBtn.title = "删除此对话";
      deleteBtn.addEventListener("click", (ev) => { ev.stopPropagation(); this.deleteSession(session.id); dropdown.remove(); });

      item.addEventListener("click", () => { this.switchSession(session.id); dropdown.remove(); });
    }

    const closeDropdown = (ev: MouseEvent) => {
      if (!dropdown.contains(ev.target as Node)) { dropdown.remove(); document.removeEventListener("click", closeDropdown); }
    };
    setTimeout(() => document.addEventListener("click", closeDropdown), 0);
  }

  private updateSessionTitle() {
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session && session.title === "新对话" && this.messages.length > 0) {
      session.title = this.messages[0].content.slice(0, 30) + (this.messages[0].content.length > 30 ? "..." : "");
      session.updatedAt = Date.now();
      this.updateSessionSelector();
    }
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
    this.messages = this.messages.slice(0, idx);
    const msgEls = this.messagesEl.querySelectorAll(".xiaoyuan-msg");
    for (let i = msgEls.length - 1; i >= idx; i--) msgEls[i].remove();
    this.saveCurrentSession();
    new Notice("已撤销");
  }

  // ─── UI helpers ──────────────────────────────────────────────────

  private createSelector(
    className: string,
    options: { value: string; label: string }[],
    currentValue: string,
    title: string,
    onChange: (value: string) => void,
    dropdownUp = false,
  ): HTMLSpanElement {
    const text = createSpan({ cls: className, title });
    const currentOption = options.find((m) => m.value === currentValue);
    text.textContent = currentOption?.label || options[0]?.label || "";

    text.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".xiaoyuan-mode-dropdown").forEach((el) => el.remove());

      const dropdown = createDiv({ cls: "xiaoyuan-mode-dropdown" });
      if (dropdownUp) dropdown.classList.add("xiaoyuan-mode-dropdown-up");

      for (const m of options) {
        const item = dropdown.createDiv({ cls: "xiaoyuan-mode-dropdown-item" });
        if (m.value === currentValue) item.classList.add("active");
        item.textContent = m.label;
        item.addEventListener("click", () => {
          text.textContent = m.label;
          onChange(m.value);
          dropdown.remove();
        });
      }

      text.appendChild(dropdown);

      const close = (ev: MouseEvent) => {
        if (!dropdown.contains(ev.target as Node)) { dropdown.remove(); document.removeEventListener("click", close); }
      };
      setTimeout(() => document.addEventListener("click", close), 0);
    });

    return text;
  }

  private setInputDisabled(disabled: boolean) {
    this.inputEl.disabled = disabled;
    this.sendBtn.classList.toggle("disabled", disabled);
  }
}
