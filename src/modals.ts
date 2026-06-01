import { App, Modal, Notice, Menu } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import { callAIWithHTTPStreaming, callAIWithAPIJson, getVaultBasePath } from "./ai";
import { OPERATION_PROMPTS, OPERATION_LABELS, WIKI_SYSTEM_PROMPTS, getActiveProvider } from "./types";
import type { ApiProviderConfig } from "./types";

function ensureApiUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}

function makeDraggable(handle: HTMLElement, modalEl: HTMLElement) {
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const rect = modalEl.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    modalEl.style.position = "fixed";
    modalEl.style.top = `${e.clientY - dy}px`;
    modalEl.style.left = `${e.clientX - dx}px`;
    modalEl.style.margin = "0";
    const move = (ev: MouseEvent) => {
      modalEl.style.top = `${ev.clientY - dy}px`;
      modalEl.style.left = `${ev.clientX - dx}px`;
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

export class TextOperationModal extends Modal {
  plugin: XiaoyuanAIPlugin;
  operation: string;
  inputText: string;
  contentAreaEl!: HTMLDivElement;
  toolsBtn!: HTMLButtonElement;
  modeLabel!: HTMLSpanElement;
  titleEl!: HTMLHeadingElement;

  constructor(app: App, plugin: XiaoyuanAIPlugin, operation: string, inputText: string) {
    super(app);
    this.plugin = plugin;
    this.operation = operation;
    this.inputText = inputText;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    contentEl.classList.add("xiaoyuan-modal-container");
    modalEl.style.height = Math.round(window.innerHeight * 0.75) + 'px';

    const headerRow = contentEl.createDiv({ cls: "xiaoyuan-modal-header" });
    this.titleEl = headerRow.createEl("h3", { text: `AI ${OPERATION_LABELS[this.operation] || this.operation}` });
    this.modeLabel = headerRow.createSpan({ cls: "xiaoyuan-modal-mode-label" });
    this.modeLabel.textContent = this.plugin.settings.execMode === "cli" ? "CLI" : "API";
    headerRow.style.cursor = "move";
    makeDraggable(headerRow, modalEl);

    this.contentAreaEl = contentEl.createDiv({ cls: "xiaoyuan-modal-content-area", text: "已连接，等待响应..." });

    const btnRow = contentEl.createDiv({ cls: "xiaoyuan-modal-btn-row" });

    this.toolsBtn = btnRow.createEl("button", { text: "AI工具", cls: "xiaoyuan-btn-secondary" });
    this.toolsBtn.addEventListener("click", (e) => this.showAIToolsMenu(e));

    const replaceBtn = btnRow.createEl("button", { text: "替换原文", cls: "xiaoyuan-btn-primary" });
    replaceBtn.addEventListener("click", () => {
      const editor = this.plugin.getActiveEditor();
      if (editor) { editor.replaceSelection(this.contentAreaEl.textContent || ""); new Notice("已替换"); }
      else new Notice("未找到活动编辑器");
      this.close();
    });

    const copyBtn = btnRow.createEl("button", { text: "复制结果", cls: "xiaoyuan-btn-secondary" });
    copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(this.contentAreaEl.textContent || ""); new Notice("已复制"); });

    const closeBtn = btnRow.createEl("button", { text: "关闭", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());

    if (this.inputText) {
      this.processOperation();
    } else {
      this.contentAreaEl.contentEditable = "true";
    }
  }

  private showAIToolsMenu(e: MouseEvent) {
    const menu = new Menu();
    ["polish", "summarize", "complete", "expand", "continue", "translate"].forEach((op) => {
      menu.addItem((item) => {
        item.setTitle(OPERATION_LABELS[op]);
        item.setIcon(
          op === "polish" ? "pencil" :
          op === "summarize" ? "file-text" :
          op === "complete" ? "check" :
          op === "expand" ? "maximize" :
          op === "continue" ? "arrow-right" :
          "globe"
        );
        item.onClick(() => this.reprocessWith(op));
      });
    });
    menu.showAtMouseEvent(e);
  }

  private async reprocessWith(operation: string) {
    const fullText = this.contentAreaEl.textContent || "";
    if (!fullText.trim()) { new Notice("内容为空，请先输入内容"); return; }

    const sel = window.getSelection();
    let textToProcess = "";
    if (sel && sel.rangeCount > 0 && this.contentAreaEl.contains(sel.anchorNode)) {
      textToProcess = sel.toString().trim();
    }
    if (!textToProcess) textToProcess = fullText;

    this.titleEl.textContent = `AI ${OPERATION_LABELS[operation] || operation}`;
    this.contentAreaEl.textContent = "已连接，等待响应...";
    this.contentAreaEl.contentEditable = "false";

    this.toolsBtn.disabled = true;
    try {
      const s = this.plugin.settings;
      const prompt = (OPERATION_PROMPTS[operation] || OPERATION_PROMPTS.polish) + textToProcess;
      let result: string;

      if (s.execMode === "cli") {
        this.modeLabel.textContent = "CLI";
        const vaultDir = getVaultBasePath(this.app.vault);
        result = await callAIWithHTTPStreaming(prompt, s, vaultDir, undefined, undefined,
          (text) => { this.contentAreaEl.textContent = `思考中... ${text}`; },
          (text) => { this.contentAreaEl.textContent = text; },
        );
      } else {
        this.modeLabel.textContent = "API";
        const provider = getActiveProvider(s);
        if (!provider || !provider.apiKey) { new Notice("API Key 未配置"); this.close(); return; }
        result = await callAIWithAPIJson(ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model, [
          { role: "system", content: s.systemPrompt },
          { role: "user", content: prompt },
        ], s.maxTokens, s.temperature, s.apiReasoningEffort);
      }

      this.contentAreaEl.textContent = result;
      this.contentAreaEl.contentEditable = "true";
    } catch (err: any) {
      this.contentAreaEl.textContent = `\u274C 错误：${err.message}`;
    } finally {
      this.toolsBtn.disabled = false;
    }
  }

  private async processOperation() {
    this.toolsBtn.disabled = true;
    try {
      const s = this.plugin.settings;
      const prompt = (OPERATION_PROMPTS[this.operation] || OPERATION_PROMPTS.polish) + this.inputText;
      let result: string;

      if (s.execMode === "cli") {
        this.modeLabel.textContent = "CLI";
        const vaultDir = getVaultBasePath(this.app.vault);
        result = await callAIWithHTTPStreaming(prompt, s, vaultDir, undefined, undefined,
          (text) => { this.contentAreaEl.textContent = `思考中... ${text}`; },
          (text) => { this.contentAreaEl.textContent = text; },
        );
      } else {
        this.modeLabel.textContent = "API";
        const provider = getActiveProvider(s);
        if (!provider || !provider.apiKey) { new Notice("API Key 未配置"); this.close(); return; }
        result = await callAIWithAPIJson(ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model, [
          { role: "system", content: s.systemPrompt },
          { role: "user", content: prompt },
        ], s.maxTokens, s.temperature, s.apiReasoningEffort);
      }

      this.contentAreaEl.textContent = result;
      this.contentAreaEl.contentEditable = "true";
    } catch (err: any) {
      this.contentAreaEl.textContent = `\u274C 错误：${err.message}`;
    } finally {
      this.toolsBtn.disabled = false;
    }
  }

  onClose() { this.contentEl.empty(); }
}

export class WikiCommandModal extends Modal {
  plugin: XiaoyuanAIPlugin;
  command: string;

  constructor(app: App, plugin: XiaoyuanAIPlugin, command: string) {
    super(app);
    this.plugin = plugin;
    this.command = command;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    contentEl.classList.add("xiaoyuan-wiki-modal-container");

    const h3El = contentEl.createEl("h3", { text: `\u{1F9E0} Wiki 命令：/${this.command}` });
    h3El.style.cursor = "move";
    makeDraggable(h3El, modalEl);

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
      submitBtn.textContent = "已连接，等待响应...";

      try {
        const s = this.plugin.settings;
        const systemPrompt = WIKI_SYSTEM_PROMPTS[this.command] || "";
        let result: string;

        if (s.execMode === "cli") {
          const fullPrompt = systemPrompt ? `${systemPrompt}\n\n---\n${text}` : text;
          const vaultDir = getVaultBasePath(this.app.vault);
          result = await callAIWithHTTPStreaming(fullPrompt, s, vaultDir, undefined, undefined,
            (t) => { submitBtn.textContent = `思考中... ${t}`; },
            (t) => { submitBtn.textContent = t; },
          );
        } else {
          const provider = getActiveProvider(s);
          if (!provider || !provider.apiKey) { new Notice("请先在设置中配置 API Key"); return; }
          const messages: { role: "system" | "user"; content: string }[] = systemPrompt
            ? [{ role: "system", content: systemPrompt }, { role: "user", content: text }]
            : [{ role: "user", content: text }];
          result = await callAIWithAPIJson(ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model, messages, s.maxTokens, s.temperature, s.apiReasoningEffort);
        }

        resultEl.classList.add("show");
        resultEl.textContent = result;
        resultEl.contentEditable = "true";
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
