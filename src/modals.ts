import { App, Modal, Notice, TFile, Menu, setIcon, setTooltip } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import { callAISession, getVaultBasePath } from "./ai";
import { OPERATION_PROMPTS, OPERATION_LABELS, OPERATIONS, OPERATION_ICONS, type Operation } from "./types";

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
  operation: Operation;
  inputText: string;
  contentAreaEl!: HTMLDivElement;
  toolsBtn!: HTMLButtonElement;
  modeLabel!: HTMLSpanElement;
  titleEl!: HTMLHeadingElement;
  thinkingBarEl!: HTMLDivElement;

  constructor(app: App, plugin: XiaoyuanAIPlugin, operation: Operation, inputText: string) {
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
    this.titleEl = headerRow.createEl("h3", { text: `AI ${OPERATION_LABELS[this.operation]}` });
    this.modeLabel = headerRow.createSpan({ cls: "xiaoyuan-modal-mode-label" });
    this.modeLabel.textContent = this.plugin.settings.execMode === "cli" ? "CLI" : "API";
    headerRow.style.cursor = "move";
    makeDraggable(headerRow, modalEl);

    this.thinkingBarEl = contentEl.createDiv({ cls: "xiaoyuan-thinking-bar" });

    this.contentAreaEl = contentEl.createDiv({ cls: "xiaoyuan-modal-content-area", text: "已连接，等待响应..." });

    const btnRow = contentEl.createDiv({ cls: "xiaoyuan-modal-btn-row" });

    const leftGroup = btnRow.createDiv({ cls: "xy-modal-btn-group" });
    const rightGroup = btnRow.createDiv({ cls: "xy-modal-btn-group" });

    const replaceBtn = leftGroup.createEl("button", { cls: "xy-icon-btn" });
    setIcon(replaceBtn, "replace");
    setTooltip(replaceBtn, "替换选中文本");
    replaceBtn.addEventListener("click", () => {
      const editor = this.plugin.getActiveEditor();
      if (editor) { editor.replaceSelection(this.contentAreaEl.textContent || ""); new Notice("已替换"); }
      else new Notice("未找到活动编辑器");
      this.close();
    });

    const copyBtn = leftGroup.createEl("button", { cls: "xy-icon-btn" });
    setIcon(copyBtn, "copy");
    setTooltip(copyBtn, "复制到剪贴板");
    copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(this.contentAreaEl.textContent || ""); new Notice("已复制"); });

    const openBtn = leftGroup.createEl("button", { cls: "xy-icon-btn" });
    setIcon(openBtn, "pencil");
    setTooltip(openBtn, "在编辑器中编辑");
    openBtn.addEventListener("click", () => this.openInEditor());

    this.toolsBtn = leftGroup.createEl("button", { cls: "xy-icon-btn" });
    setIcon(this.toolsBtn, "sparkles");
    setTooltip(this.toolsBtn, "切换 AI 操作");
    this.toolsBtn.addEventListener("click", (e) => this.showAIToolsMenu(e));

    const closeBtn = rightGroup.createEl("button", { text: "关闭", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());

    if (this.inputText) {
      this.processOperation();
    } else {
      this.contentAreaEl.contentEditable = "true";
    }
  }

  private showAIToolsMenu(e: MouseEvent) {
    const menu = new Menu();
    OPERATIONS.forEach((op) => {
      menu.addItem((item) => {
        item.setTitle(OPERATION_LABELS[op]);
        item.setIcon(OPERATION_ICONS[op]);
        item.onClick(() => this.reprocessWith(op));
      });
    });
    menu.showAtMouseEvent(e);
  }

  private async reprocessWith(operation: Operation) {
    const fullText = this.contentAreaEl.textContent || "";
    if (!fullText.trim()) { new Notice("内容为空，请先输入内容"); return; }

    const sel = window.getSelection();
    let textToProcess = "";
    if (sel && sel.rangeCount > 0 && this.contentAreaEl.contains(sel.anchorNode)) {
      textToProcess = sel.toString().trim();
    }
    if (!textToProcess) textToProcess = fullText;

    this.titleEl.textContent = `AI ${OPERATION_LABELS[operation]}`;
    this.contentAreaEl.textContent = "已连接，等待响应...";
    this.contentAreaEl.contentEditable = "false";

    this.toolsBtn.disabled = true;
    this.thinkingBarEl.classList.add("is-active");
    try {
      const s = this.plugin.settings;
      const prompt = OPERATION_PROMPTS[operation] + textToProcess;
      const vaultDir = getVaultBasePath(this.app.vault);
      const result = await callAISession({
        prompt, settings: s, vaultDir,
        onThinking: (text) => { this.contentAreaEl.textContent = `思考中... ${text}`; },
        onTextUpdate: (text) => { this.contentAreaEl.textContent = text; },
      });
      this.contentAreaEl.textContent = result;
      this.contentAreaEl.contentEditable = "true";
    } catch (err: unknown) {
      this.contentAreaEl.textContent = `\u274C 错误：${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this.toolsBtn.disabled = false;
      this.thinkingBarEl.classList.remove("is-active");
    }
  }

  private async processOperation() {
    this.toolsBtn.disabled = true;
    this.thinkingBarEl.classList.add("is-active");
    try {
      const s = this.plugin.settings;
      const prompt = OPERATION_PROMPTS[this.operation] + this.inputText;
      const vaultDir = getVaultBasePath(this.app.vault);
      const result = await callAISession({
        prompt, settings: s, vaultDir,
        onThinking: (text) => { this.contentAreaEl.textContent = `思考中... ${text}`; },
        onTextUpdate: (text) => { this.contentAreaEl.textContent = text; },
      });
      this.contentAreaEl.textContent = result;
      this.contentAreaEl.contentEditable = "true";
    } catch (err: unknown) {
      this.contentAreaEl.textContent = `\u274C 错误：${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this.toolsBtn.disabled = false;
      this.thinkingBarEl.classList.remove("is-active");
    }
  }

  private async openInEditor() {
    const content = this.contentAreaEl.textContent || "";
    if (!content.trim()) return;
    try {
      const vault = this.app.vault;
      const tempRel = `${this.plugin.settings.chatHistoryPath}/temp`;
      try { await vault.createFolder(tempRel); } catch {}
      const dateStr = String(Date.now()).slice(-8);
      const hash = this.simpleHash(content);
      const fileRel = `${tempRel}/ai-result-${dateStr}-${hash}.md`;
      const existing = vault.getAbstractFileByPath(fileRel);
      let file: TFile;
      if (existing instanceof TFile) {
        await vault.modify(existing, content);
        file = existing;
      } else {
        file = await vault.create(fileRel, content);
      }
      await this.app.workspace.getLeaf("tab").openFile(file);
    } catch (err: unknown) {
      new Notice(`打开失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private simpleHash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return (h >>> 0).toString(36);
  }

  onClose() { this.contentEl.empty(); }
}


