import { App, Modal, Notice, Menu } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import { callAISession, getVaultBasePath } from "./ai";
import { OPERATION_PROMPTS, OPERATION_LABELS, OPERATIONS, OPERATION_ICONS, VIEW_TYPE_XIAOYUAN_AI_CHAT } from "./constants";
import type { Operation } from "./types";
import { openInEditor } from "./open-in-editor";
import { createActionBtn } from "./action-buttons";
import { registerSelectionListener } from "./selection-popup";

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
  toolsBtn!: HTMLElement;
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

    const replaceBtn = createActionBtn("replace");
    replaceBtn.addEventListener("click", () => {
      const editor = this.plugin.getActiveEditor();
      if (editor) { editor.replaceSelection(this.contentAreaEl.textContent || ""); new Notice("已替换"); }
      else new Notice("未找到活动编辑器");
      this.close();
    });
    leftGroup.appendChild(replaceBtn);

    const copyBtn = createActionBtn("copy");
    copyBtn.addEventListener("click", () => { navigator.clipboard.writeText(this.contentAreaEl.textContent || ""); new Notice("已复制"); });
    leftGroup.appendChild(copyBtn);

    const openBtn = createActionBtn("edit");
    openBtn.addEventListener("click", () => {
      const content = this.contentAreaEl.textContent || "";
      if (!content.trim()) return;
      openInEditor(content, this.app.vault, this.app.workspace, this.plugin.settings.chatHistoryPath, undefined, "modal");
      this.close();
    });
    leftGroup.appendChild(openBtn);

    const captureBtn = createActionBtn("capture");
    captureBtn.addEventListener("click", () => {
      const content = this.contentAreaEl.textContent || "";
      navigator.clipboard.writeText(content);
      const cmdId = this.plugin.settings.captureCommandId;
      if (cmdId) this.app.commands.executeCommandById(cmdId);
      new Notice("已捕获");
    });
    leftGroup.appendChild(captureBtn);

    this.toolsBtn = createActionBtn("aiTools");
    this.toolsBtn.addEventListener("click", (e) => this.showAIToolsMenu(e));
    leftGroup.appendChild(this.toolsBtn);

    const closeBtn = rightGroup.createEl("button", { text: "关闭", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());

    if (this.inputText) {
      this.processOperation();
    } else {
      this.contentAreaEl.contentEditable = "true";
    }

    registerSelectionListener(this.contentAreaEl, {
      getSelectedText: () => window.getSelection()?.toString().trim() || "",
      getPosition: () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !this.contentAreaEl.contains(sel.anchorNode)) return null;
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - 60, y: rect.top - 36 };
      },
      onSpeak: (text) => {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[#*_`\[\]]/g, ""));
        u.lang = "zh-CN"; speechSynthesis.speak(u);
      },
      onQuote: (text) => {
        let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
        if (!leaf) {
          const leafRight = this.app.workspace.getRightLeaf(false);
          if (leafRight) {
            leafRight.setViewState({ type: VIEW_TYPE_XIAOYUAN_AI_CHAT, active: true });
            leaf = leafRight;
          }
        }
        if (leaf) this.app.workspace.revealLeaf(leaf);
        if (leaf?.view) {
          leaf.view.quote?.(text);
        }
      },
      onAITools: (text, e) => {
        if (!text.trim()) return;
        const menu = new Menu();
        OPERATIONS.forEach((op) => {
          menu.addItem((item) => {
            item.setTitle(OPERATION_LABELS[op]);
            item.setIcon(OPERATION_ICONS[op]);
            item.onClick(() => {
              this.titleEl.textContent = `AI ${OPERATION_LABELS[op]}`;
              this.contentAreaEl.textContent = text;
              this.operation = op;
              this.inputText = text;
              this.processOperation();
            });
          });
        });
        menu.showAtMouseEvent(e);
      },
      onCapture: (text) => {
        navigator.clipboard.writeText(text);
        const cmdId = this.plugin.settings.captureCommandId;
        if (cmdId) this.app.commands.executeCommandById(cmdId);
      },
    });
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

    this.thinkingBarEl.classList.add("is-active");
    try {
      const s = this.plugin.settings;
      const prompt = OPERATION_PROMPTS[operation] + textToProcess;
      const vaultDir = getVaultBasePath();
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
      this.thinkingBarEl.classList.remove("is-active");
    }
  }

  private async processOperation() {
    this.thinkingBarEl.classList.add("is-active");
    try {
      const s = this.plugin.settings;
      const prompt = OPERATION_PROMPTS[this.operation] + this.inputText;
      const vaultDir = getVaultBasePath();
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
      this.thinkingBarEl.classList.remove("is-active");
    }
  }

  onClose() { this.contentEl.empty(); }
}


