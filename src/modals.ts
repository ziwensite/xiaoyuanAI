import { App, Modal, Notice } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import { callAIWithCLI, callAIWithAPIJson, getVaultBasePath } from "./ai";
import { OPERATION_PROMPTS, OPERATION_LABELS, WIKI_SYSTEM_PROMPTS } from "./types";

export class TextOperationModal extends Modal {
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
        const vaultDir = getVaultBasePath(this.app.vault);
        result = await callAIWithCLI(prompt, s, vaultDir);
      } else {
        this.modeLabel.textContent = "API";
        if (!s.apiKey) { new Notice("API Key 未配置"); this.close(); return; }
        result = await callAIWithAPIJson(s.apiEndpoint, s.apiKey, s.model, [
          { role: "user", content: prompt },
        ], s.maxTokens, s.temperature);
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

export class WikiCommandModal extends Modal {
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
          const vaultDir = getVaultBasePath(this.app.vault);
          result = await callAIWithCLI(fullPrompt, s, vaultDir);
        } else {
          if (!s.apiKey) { new Notice("请先在设置中配置 API Key"); return; }
          const messages: { role: "system" | "user"; content: string }[] = systemPrompt
            ? [{ role: "system", content: systemPrompt }, { role: "user", content: text }]
            : [{ role: "user", content: text }];
          result = await callAIWithAPIJson(s.apiEndpoint, s.apiKey, s.model, messages, s.maxTokens, s.temperature);
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
